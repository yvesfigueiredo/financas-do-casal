# Regras de Negócio — Finanças do Casal

Este documento descreve as regras de negócio que governam o comportamento do sistema, independente de implementação técnica.

---

## 1. Usuários

- O sistema possui exatamente dois usuários fixos: **Yves** e **Carol**.
- Não existe cadastro, login com senha, ou múltiplas contas.
- Na tela inicial, o usuário escolhe com qual perfil deseja navegar.
- O usuário selecionado é usado para pré-preencher formulários, mas qualquer lançamento pode ser atribuído a qualquer um dos dois usuários, permitindo que um registre uma despesa do outro.
- A seleção de usuário persiste localmente (localStorage) entre sessões até que "Trocar usuário" seja acionado.

---

## 2. Parcelamentos

- **Regra central do sistema.** Toda compra parcelada gera **N lançamentos individuais persistidos no banco** — nunca calculados dinamicamente em tempo de consulta.
- O valor de cada parcela é `totalAmount / installmentCount`, arredondado para 2 casas decimais.
- A primeira parcela é lançada na data informada; as demais avançam um mês a cada parcela, preservando o dia (com ajuste automático de calendário pelo JavaScript `Date`).
- Uma parcela é considerada **paga** se sua data for menor ou igual à data atual; **pendente** caso contrário. Não existe campo de status — o estado é sempre derivado da data em tempo de leitura.
- Excluir um parcelamento remove **todas** as parcelas relacionadas (cascade). Não é possível excluir uma parcela individualmente — a tentativa retorna erro de validação orientando a exclusão do parcelamento completo.
- Um parcelamento pode opcionalmente estar vinculado a um cartão de crédito (`creditCardId`), o que faz seu valor entrar no cálculo de fatura daquele cartão.

---

## 3. Cartões de Crédito

- Cada cartão tem `closingDay` (dia de fechamento) e `dueDay` (dia de vencimento).
- O **período de fatura atual** é calculado a partir do dia de fechamento: se o fechamento deste mês já passou, a fatura corrente vai do fechamento do mês passado até o fechamento do próximo mês.
- **Limite utilizado** = soma de todas as despesas (`type: expense`) vinculadas ao cartão dentro do período de fatura atual.
- **Limite disponível** = `limit - usado`, nunca exibido como negativo (truncado em zero na UI, embora o valor real possa ser negativo internamente para fins de alerta).
- Cartões podem ser inativados (soft state via campo `active`) sem perder histórico de lançamentos.

---

## 4. Contas Bancárias

- Toda receita pode opcionalmente "entrar" em uma conta; toda despesa pode "sair" de uma conta.
- O saldo de uma conta (`currentBalance`) é atualizado **incrementalmente** a cada lançamento ou transferência vinculada — não é recalculado do zero a cada consulta.
- Excluir um lançamento vinculado a uma conta reverte o efeito no saldo (estorna o valor).
- **Transferências** entre contas são uma entidade própria (`Transfer`), distinta de `Transaction`. Uma transferência decrementa o saldo da conta de origem e incrementa o da conta de destino atomicamente.
- Uma transferência só é permitida se a conta de origem tiver saldo suficiente (`currentBalance >= amount`); caso contrário, é rejeitada com erro 422.

---

## 5. Contas Fixas (Despesas Recorrentes)

- Uma conta fixa define uma despesa que se repete em uma periodicidade: mensal, semanal, quinzenal, trimestral, semestral ou anual.
- **A geração de lançamentos é idempotente.** Para cada mês/ano, o sistema verifica se já existe uma transação com aquele `recurringExpenseId` naquele período antes de criar uma nova — nunca duplica.
- A rotina de geração (`POST /recurring-expenses/generate`) pode ser disparada manualmente pelo usuário a qualquer momento; ela varre todas as contas fixas ativas e gera apenas o que estiver pendente segundo a regra `shouldGenerateForMonth`.
- Uma conta fixa pode estar vinculada a um cartão de crédito; nesse caso, o lançamento gerado entra automaticamente no cálculo de fatura daquele cartão.

---

## 6. Alertas

O sistema gera alertas automaticamente ao executar uma varredura (`POST /alerts/scan`), cobrindo:

1. **Fechamento de cartão amanhã** — dispara um dia antes do `closingDay`.
2. **Conta fixa vence amanhã** — dispara um dia antes do `dueDay`.
3. **Limite do cartão acima de 80%** — verificado contra o uso na fatura corrente.
4. **Saldo de conta bancária negativo** — verificado em todas as contas ativas.
5. **Parcelamento encerrando** — dispara quando resta exatamente 1 parcela pendente.

Cada tipo de alerta é gerado **no máximo uma vez por dia** por recurso (evita spam de alertas repetidos). Alertas podem ser marcados como lidos ou dispensados; alertas dispensados há mais de 30 dias são limpos automaticamente na próxima varredura.

---

## 7. Índice de Saúde Financeira

Nota de 0 a 100, calculada como soma ponderada de 6 critérios:

| Critério | Peso | O que mede |
|---|---|---|
| Comprometimento da renda | 25% | % da renda mensal gasta em despesas |
| Uso dos cartões | 20% | % do limite total de crédito utilizado |
| Quantidade de parcelamentos | 15% | Número de parcelamentos ativos simultâneos |
| Saldo previsto | 15% | Saldo projetado descontando compromissos futuros do mês |
| Reserva financeira | 15% | Meses de despesas cobertos pelo saldo em contas |
| Contas recorrentes | 10% | % da renda comprometida com contas fixas mensais |

A nota final mapeia para uma letra (A–F). Recomendações são geradas dinamicamente a partir dos critérios que estiverem fora do ideal — nunca há texto fixo independente dos dados.

---

## 8. Assistente Financeiro

Gera insights **100% derivados dos dados reais** — nunca mensagens fixas ou genéricas. As análises comparam:

- Gasto do mês atual vs. média dos últimos 3 meses (variação > 25% gera alerta).
- Gasto por categoria mês a mês (variação > 40% gera alerta de categoria).
- Uso de cada cartão individualmente (acima de 75% gera alerta).
- Proporção de parcelas sobre a renda (acima de 30% gera alerta).
- Progresso de objetivos financeiros próximos do prazo.
- Taxa de poupança do mês (acima de 20% gera insight positivo).

---

## 9. Reserva de Emergência

- Calculada como `saldo total das contas ativas / média de despesas dos últimos 3 meses`.
- Meta recomendada: **6 meses** de despesas cobertas.
- Classificação: crítica (< 1 mês), insuficiente (1–3 meses), adequada (3–6 meses), excelente (≥ 6 meses).

---

## 10. Objetivos Financeiros

- Um objetivo tem valor alvo, valor atual, categoria e prazo opcional.
- Contribuições são lançadas manualmente pelo usuário (não há vínculo automático com transações).
- A previsão de conclusão é estimada pela velocidade média de contribuição desde a criação do objetivo (`currentAmount / meses desde criação`), projetada sobre o valor restante.
- Um objetivo é considerado "em risco" quando está abaixo de 50% de progresso e restam menos de 6 meses para o prazo.

---

## 11. Linha do Tempo

Agrega cronologicamente, a partir de hoje:
- Parcelas futuras já lançadas.
- Próximas ocorrências de contas fixas (projetadas conforme periodicidade).
- Próximo vencimento de fatura de cada cartão ativo (se houver saldo a pagar).

O saldo previsto exibido em cada evento é calculado **acumulativamente** a partir do saldo atual das contas, debitando/creditando cada evento em ordem cronológica.

---

## 12. Importação Bancária

- Suporta arquivos OFX (parser de blocos `<STMTTRN>`) e CSV (com detecção automática de separador `,` ou `;`).
- **Detecção de duplicatas**: uma transação é considerada duplicata se já existir um lançamento na mesma conta, mesma data, mesmo valor e descrição similar (primeiros 20 caracteres).
- **Categorização automática**: a descrição é varrida contra um dicionário de palavras-chave por categoria; se nenhuma palavra-chave corresponder, usa a categoria "Outros" do tipo apropriado.
- Transações duplicadas são contabilizadas mas **não são importadas novamente**.

---

## 13. Simulador e Cenários

- O simulador nunca grava no banco até o usuário clicar em "Confirmar simulação".
- Um cenário pode ser salvo para comparação posterior; cenários salvos armazenam o input e o resultado completo serializados em JSON.
- O comparador permite selecionar até 3 cenários simultaneamente para visualização lado a lado.

---

## 14. Categorias

- Categorias são fixas no seed inicial, mas a estrutura permite expansão.
- Toda categoria tem um `type` (`income` ou `expense`), que restringe em quais formulários ela aparece.
