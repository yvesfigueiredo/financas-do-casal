# Decisões Técnicas — Finanças do Casal

Registro das principais decisões de arquitetura e suas justificativas.

---

## 1. SQLite como banco de dados

**Decisão:** usar SQLite (arquivo local) em vez de PostgreSQL/MySQL.

**Justificativa:** o sistema é de uso pessoal/doméstico para dois usuários fixos, sem necessidade de concorrência de escrita real ou hospedagem multi-tenant. SQLite elimina a necessidade de um servidor de banco separado, simplificando drasticamente a instalação — um requisito explícito do projeto ("instalar em máquina limpa seguindo apenas o README").

**Trade-off aceito:** sem suporte nativo a conexões concorrentes de alta escala. Irrelevante neste contexto de uso.

---

## 2. Parcelas persistidas individualmente, nunca calculadas dinamicamente

**Decisão:** ao criar uma compra parcelada em N vezes, o sistema cria N registros de `Transaction` imediatamente, todos vinculados a um `Installment` pai.

**Justificativa:** essa foi uma exigência explícita e repetida em todas as sprints. Calcular parcelas dinamicamente introduziria fragilidade: edições de categoria, exclusões parciais, e relatórios históricos ficariam inconsistentes. Persistir cada parcela como uma transação real torna todo o sistema de relatórios, dashboard e filtros automaticamente compatível sem lógica especial.

**Trade-off aceito:** criar um parcelamento de 120x gera 120 linhas no banco de uma vez. Para o volume de dados de um casal, isso é irrelevante em termos de performance.

---

## 3. Arquitetura em camadas (Controller → Service → Repository → Prisma)

**Decisão:** todo recurso (transações, cartões, contas, etc.) segue rigorosamente essa cadeia, sem exceções.

**Justificativa:** mesmo em um projeto de porte pessoal, a separação de responsabilidades paga dividendos à medida que o sistema cresce (Sprint 1 → Sprint 3 adicionou 9 entidades novas sem refatoração estrutural). Controllers nunca acessam o Prisma diretamente; Services nunca recebem `Request`/`Response`; Repositories nunca contêm lógica de negócio.

---

## 4. Estado do parcelamento (pago/pendente) derivado, não armazenado

**Decisão:** não existe campo `status` ou `paid: boolean` em `Transaction`. Uma parcela é "paga" se `date <= hoje`.

**Justificativa:** evita inconsistência entre o campo de status e a realidade temporal. Se o sistema ficar offline por semanas, ao reabrir, todas as parcelas com data passada automaticamente aparecem como pagas, sem necessidade de rotina de sincronização.

---

## 5. Saldo de conta bancária como campo incremental, não agregado

**Decisão:** `BankAccount.currentBalance` é atualizado via `increment`/`decrement` a cada operação, em vez de ser recalculado somando todas as transações a cada leitura.

**Justificativa:** com o crescimento do histórico de transações ao longo de anos de uso, recalcular o saldo somando todas as transações desde o início ficaria progressivamente mais caro. O campo incremental mantém leitura O(1).

**Trade-off aceito:** exige disciplina para sempre reverter o saldo ao excluir uma transação vinculada (implementado em `TransactionService.deleteSimple`). Um drift seria possível apenas por bug de código, não por design.

---

## 6. Geração de contas fixas via rotina idempotente, não cron job

**Decisão:** a geração de lançamentos recorrentes é uma rota HTTP (`POST /recurring-expenses/generate`) chamada manualmente ou por um agendador externo, em vez de um cron job embutido no processo Node.

**Justificativa:** o ambiente de deploy alvo (instalação local/doméstica) não garante que o processo Node fique sempre ativo. Uma rotina idempotente que pode ser chamada a qualquer momento (e que não duplica registros independente de quantas vezes for chamada) é mais robusta do que depender de um timer interno que para quando o processo reinicia.

---

## 7. Migrations SQL versionadas manualmente, espelhando o schema

**Decisão:** as migrations em `backend/prisma/migrations/` foram escritas diretamente em SQL, espelhando exatamente o `schema.prisma`, em vez de geradas pelo CLI interativo do Prisma em tempo real durante esta sessão.

**Justificativa:** o ambiente de build usado para preparar esta entrega não possui acesso de rede ao registry do npm/Prisma. Para garantir que o projeto seja instalável em qualquer máquina com Node.js, as migrations foram escritas manualmente e validadas campo a campo contra o schema (ver `RC1_AUDIT_REPORT.md`, seção 9 — diff automatizado de tabelas e colunas). Em ambiente de desenvolvimento normal com acesso à rede, `npx prisma migrate dev --name nome` geraria resultado equivalente automaticamente.

**Risco mitigado:** qualquer divergência entre schema e migration quebraria `prisma generate` ou o build do Prisma Client. Por isso, uma verificação automatizada (diff de tabelas e colunas) foi executada antes da entrega, confirmando paridade total entre as 12 tabelas do schema e as 12 tabelas das migrations.

---

## 8. Insights do assistente financeiro gerados algoritmicamente, sem LLM

**Decisão:** o "Assistente Financeiro Inteligente" não usa um modelo de linguagem; é um motor de regras que compara métricas (médias móveis, variação percentual, limiares) e monta mensagens com template strings preenchidos com os números reais.

**Justificativa:** a exigência era "nunca utilizar mensagens fixas" — interpretada como "nunca mensagens genéricas desconectadas dos dados do usuário". Um motor de regras determinístico é mais previsível, auditável, não depende de API externa paga, e atende ao requisito de personalização total: cada mensagem incorpora os números exatos da situação do usuário (ex: "Gastos 34% acima da média" usa o valor real calculado, nunca um texto genérico).

---

## 9. Zustand para estado global em vez de Context API ou Redux

**Decisão:** autenticação (usuário selecionado) e filtros globais (mês/ano/pessoa) usam Zustand.

**Justificativa:** menor boilerplate que Redux, sem os re-renders excessivos do Context API quando múltiplos componentes consomem o mesmo estado. O middleware `persist` do Zustand resolve a persistência de sessão em localStorage sem código adicional.

---

## 10. React Query para todo o data-fetching

**Decisão:** nenhum `useEffect` + `fetch` manual; toda chamada à API passa por hooks do React Query.

**Justificativa:** cache automático, invalidação declarativa (`invalidateQueries` após mutations), deduplicação de requisições e estado de loading/error padronizado, eliminando a necessidade de gerenciar esses estados manualmente em cada página.

---

## 11. Cálculo de fatura de cartão baseado em janela de fechamento, não em mês calendário

**Decisão:** `getCardBillingPeriod()` calcula o período da fatura corrente como "do dia seguinte ao último fechamento até o próximo fechamento", não como "01 a 30 do mês corrente".

**Justificativa:** reflete como faturas de cartão de crédito realmente funcionam no Brasil — uma compra feita após o fechamento do dia 3 só aparece na fatura que vence no mês seguinte, não na fatura do mês corrente.

---

## 12. Dois dashboards distintos (Dashboard e Dashboard Executivo)

**Decisão:** o Dashboard original (Sprint 1/2) foi mantido inalterado; um novo "Dashboard Executivo" foi adicionado como página separada na Sprint 3, em vez de substituir ou sobrecarregar o dashboard existente.

**Justificativa:** requisito explícito de não quebrar funcionalidade existente. O Dashboard Executivo consolida métricas de mais alto nível (saúde financeira, reserva, insights do assistente) que fazem sentido como uma visão gerencial separada da visão operacional do dia a dia.

---

## 13. Sidebar agrupada em seções na Sprint 3

**Decisão:** com 17 páginas, a navegação lateral foi reorganizada em três grupos (Visão Geral, Lançamentos, Planejamento) em vez de uma lista plana.

**Justificativa:** uma lista plana de 17 itens prejudica a localização rápida de funcionalidades. O agrupamento reduz carga cognitiva sem introduzir um segundo nível de navegação (como menus colapsáveis), que adicionaria complexidade de estado desnecessária para este volume de itens.
