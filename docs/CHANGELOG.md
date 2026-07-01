# Changelog — Finanças do Casal

Todas as mudanças notáveis são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [3.0.0] — Sprint 3 — 2026-06-30

### Adicionado

#### Funcionalidades novas
- **Índice de Saúde Financeira** — nota 0–100 com grade A–F, calculada a partir de 6 critérios ponderados (comprometimento de renda, uso de cartões, parcelamentos, saldo previsto, reserva de emergência, contas fixas). Recomendações geradas automaticamente a partir dos dados reais.
- **Assistente Financeiro Inteligente** — motor de análise dinâmica que detecta: gastos acima da média histórica, anomalias por categoria, cartões com limite alto, sobrecarga de parcelas, progresso de objetivos em risco, e tendências positivas (economia acima de 20%). Nenhuma mensagem fixa — todo texto incorpora os números reais do usuário.
- **Dashboard Executivo** — página consolidada com: saúde financeira, reserva de emergência, saldo atual/previsto, médias de 3 meses, top entidades (categoria, cartão, conta, conta fixa), progresso de objetivos, contagem de alertas e painel do assistente.
- **Projeção Financeira** — projeção de 6, 12, 24 ou 36 meses considerando médias históricas, parcelas futuras e contas fixas. Gráfico de área + tabela detalhada + marcos de saldo em cada horizonte temporal.
- **Comparador de Cenários** — salvamento de simulações com nome e descrição; visualização comparativa de até 3 cenários lado a lado (gráfico de barras de impacto total).
- **Objetivos Financeiros** — entidade `FinancialGoal` com categorias (poupança, investimento, quitação de dívida, compra, emergência), barra de progresso, previsão de conclusão baseada na velocidade de contribuição, e alerta de risco quando o prazo está próximo.
- **Reserva de Emergência** — card visual com meses protegidos, status (crítica/insuficiente/adequada/excelente) e valor faltante para atingir a meta de 6 meses.
- **Importação Bancária** — suporte a OFX e CSV com: parser de blocos `<STMTTRN>` para OFX, detecção automática de separador para CSV, detecção heurística de duplicatas, categorização automática por palavras-chave, histórico de importações.
- **Linha do Tempo Financeira** — página com todos os eventos futuros em ordem cronológica (parcelas, contas fixas, faturas de cartão), com saldo previsto acumulado após cada evento. Filtro de 30/60/90/180 dias.

#### Backend
- 8 novos endpoints (health-score, assistant, goals, projection, emergency-reserve, timeline, scenarios, bank-imports, executive-dashboard)
- 3 novas tabelas no banco: `financial_goals`, `simulation_scenarios`, `bank_imports`
- Migration `20240102000000_sprint3` com DDL completo
- Seed atualizado com 2 objetivos financeiros de exemplo (Reserva de Emergência e Viagem para Europa)

#### Frontend
- 7 novas páginas: Executive Dashboard, Timeline, Goals, Projection, Bank Import, e expansão do Simulator
- 3 novos componentes de gráfico: HealthScoreGauge (gauge SVG), AssistantPanel, EmergencyReserveCard
- Sidebar reorganizada em 3 grupos (Visão Geral, Lançamentos, Planejamento) com 17 itens únicos
- Hook `useSprint3.ts` centralizando todos os hooks da Sprint 3

### Corrigido (Auditoria RC1)
- "Esposa" renomeado para "Carol" em 100% do projeto (seed, types, components, README, documentação)
- Migrations ausentes criadas manualmente e validadas campo a campo contra o schema Prisma
- Script `db` ausente adicionado ao `backend/package.json`
- Diretórios corrompidos com chaves `{}`no nome removidos
- Categoria errada no seed (Academia usava `catSalario` em vez de `catSaude`)
- Imports `addPeriod` não utilizados removidos dos services de dashboard e simulation
- `Badge` com prop `style` substituído por `span` nativo em AlertsPage
- Blocos `catch (_) {}` vazios substituídos por comentário explicativo
- `@types/node` adicionado ao `devDependencies` do frontend
- `.gitignore` criado cobrindo `node_modules`, `dist`, `*.db`, `.env`
- Ícones duplicados na sidebar substituídos por ícones únicos por item

---

## [2.0.0] — Sprint 2 — 2026-06-29

### Adicionado

#### Entidades novas
- **Cartão de Crédito** (`CreditCard`) — CRUD completo com estatísticas calculadas (utilizado, disponível, % uso, próxima fatura, contagem de compras). Toggle ativo/inativo.
- **Conta Bancária** (`BankAccount`) — CRUD com saldo incremental, entradas, saídas, transferências entre contas.
- **Transferência** (`Transfer`) — entidade própria que debita a conta de origem e credita a de destino, validando saldo suficiente.
- **Despesa Recorrente** (`RecurringExpense`) — contas fixas com periodicidade configurável, geração idempotente de lançamentos, vinculação opcional a cartão.
- **Alerta** (`Alert`) — sistema de alertas com 5 tipos: fechamento de cartão amanhã, conta vence amanhã, limite alto, saldo negativo, parcela encerrando.

#### Lançamentos expandidos
- Campo `paymentMethod` (Dinheiro, PIX, Débito, Cartão de Crédito) em todas as transações.
- Vínculo opcional com cartão de crédito (`creditCardId`) e conta bancária (`bankAccountId`).
- Lançamentos gerados por contas fixas rastreados via `recurringExpenseId`.

#### Dashboard expandido
- Card de crédito consolidado (limite total / utilizado / disponível).
- Quick cards: comprometido em parcelas, comprometido em fixas, maior categoria, maior cartão.
- Previsão de saldo até o fim do mês.
- Próximas faturas por cartão.
- Gráfico de gastos por cartão (barras horizontais com cor do cartão).

#### Novas páginas
- Cartões de Crédito — cards com barra de uso, dias de fechamento/vencimento, próxima fatura, ações.
- Contas Bancárias — cards com saldo atual, entradas/saídas/transferências, modal de nova transferência.
- Contas Fixas — cards com próximo vencimento, periodicidade, botão "Gerar este mês".
- Resumo Anual — gráfico de linhas (receitas × despesas), gráfico de linha (saldo acumulado), gráfico de barras (comprometimento futuro 12 meses), tabela mensal.
- Fluxo de Caixa — projeção de 24 meses com gráfico de área e tabela de composição.
- Simulador Financeiro — simula compra à vista, parcelada ou recorrente com gráfico de impacto mensal e botão de confirmação.
- Calendário Financeiro — grade mensal com eventos por dia em cores por tipo, painel lateral de detalhe.
- Central de Alertas — painel de alertas com badge de não lidos na sidebar, ações de marcar como lido e dispensar.

---

## [1.0.0] — Sprint 1 — 2026-06-28

### Adicionado

#### Sistema base
- Tela inicial com seleção de usuário ("Entrar como Yves" / "Entrar como Carol") — sem cadastro ou senha.
- Estado de autenticação persistido em localStorage via Zustand.

#### Entidades
- `User` — Yves e Carol, criados no seed.
- `Category` — 9 categorias de despesa + 4 de receita, criadas no seed.
- `Installment` — parcelamento pai com descrição, total, quantidade e valor da parcela.
- `Transaction` — lançamento individual; quando parcelado, vinculado ao `Installment` pai.

#### API
- `GET /api/users` — lista os dois usuários.
- `GET /api/categories` — lista categorias, com filtro opcional por `type`.
- `GET /api/transactions` — lista com filtros (mês, ano, usuário, tipo, categoria) e paginação.
- `POST /api/transactions` — cria lançamento simples.
- `POST /api/transactions/installment` — cria parcelamento (N transações).
- `DELETE /api/transactions/:id` — exclui lançamento simples (não parcela).
- `DELETE /api/transactions/installment/:id` — exclui parcelamento completo (cascade).
- `GET /api/installments` — lista parcelamentos com progresso calculado.
- `GET /api/installments/:id` — detalhe de um parcelamento.
- `GET /api/dashboard` — resumo financeiro do período (receitas, despesas, saldo, por categoria, por usuário, comprometimento futuro).

#### Frontend
- Dashboard com cards de resumo, gráfico de pizza (categorias), gráfico de barras (Yves × Carol), card de comprometimento dos próximos 3 meses.
- Página de Lançamentos com filtros por tipo, pessoa, mês/ano e paginação.
- Página de Parcelas com linha do tempo visual (✔ pago / ○ pendente), barra de progresso, valores pagos e a pagar.
- Modal de novo lançamento com abas "Simples" e "Parcelado", preview do valor da parcela em tempo real.
- Sidebar com navegação entre as 3 páginas.
- Filtro de período global sincronizado entre dashboard e outras páginas via Zustand.

#### Infraestrutura
- Backend Express + TypeScript com validação Zod em todos os endpoints.
- Prisma ORM com SQLite; seed com usuários, categorias e dados de exemplo.
- Frontend React + Vite + TailwindCSS + React Query + React Router.
