# API Reference — Finanças do Casal

Base URL: `http://localhost:3333/api`

Todas as respostas seguem o formato:
```json
{ "success": true, "data": { ... }, "message": "opcional" }
```
Erros:
```json
{ "success": false, "error": "Mensagem de erro" }
```

---

## Health

### `GET /health`
Verifica se o servidor está no ar.

---

## Usuários

### `GET /api/users`
Lista os dois usuários do sistema.

**Resposta:**
```json
[{ "id": "...", "name": "Yves" }, { "id": "...", "name": "Carol" }]
```

---

## Categorias

### `GET /api/categories`
Lista todas as categorias.

**Query params:** `type` — `"income"` ou `"expense"` (opcional)

---

## Transações

### `GET /api/transactions`
Lista lançamentos com filtros e paginação.

**Query params:**
| Param | Tipo | Default |
|---|---|---|
| `month` | 1–12 | — |
| `year` | number | — |
| `userId` | string | — |
| `type` | income\|expense | — |
| `categoryId` | string | — |
| `creditCardId` | string | — |
| `bankAccountId` | string | — |
| `page` | number | 1 |
| `limit` | 1–100 | 20 |

### `GET /api/transactions/:id`
Retorna uma transação por ID.

### `POST /api/transactions`
Cria um lançamento simples.

**Body:**
```json
{
  "description": "Supermercado",
  "amount": 450.00,
  "type": "expense",
  "date": "2026-06-10T12:00:00.000Z",
  "paymentMethod": "debit",
  "userId": "...",
  "categoryId": "...",
  "creditCardId": "...",
  "bankAccountId": "..."
}
```

### `POST /api/transactions/installment`
Cria um parcelamento. Persiste N transações individualmente.

**Body:**
```json
{
  "description": "Notebook",
  "totalAmount": 6000,
  "installmentCount": 10,
  "startDate": "2026-06-05T12:00:00.000Z",
  "paymentMethod": "credit",
  "userId": "...",
  "categoryId": "...",
  "creditCardId": "..."
}
```

**Resposta:** `{ "installmentId": "...", "transactionsCreated": 10 }`

### `DELETE /api/transactions/:id`
Exclui lançamento simples (retorna erro se for parcela).

### `DELETE /api/transactions/installment/:installmentId`
Exclui parcelamento e todas as parcelas (cascade).

---

## Parcelamentos

### `GET /api/installments`
Lista todos com progresso calculado (paidCount, pendingCount, paidAmount, pendingAmount).

### `GET /api/installments/:id`
Detalhe de um parcelamento.

---

## Dashboard

### `GET /api/dashboard`
Resumo financeiro do período.

**Query:** `month`, `year`, `userId`

**Resposta inclui:** totalIncome, totalExpense, balance, totalCreditLimit, totalCreditUsed, totalCreditAvailable, byCategory, byUser, byCard, upcomingInstallments, nextInvoices, topCategory, topCard, balanceForecast, committedInstallments, committedRecurring, nextBill, nextInvoice

### `GET /api/dashboard/annual`
Resumo anual com 12 meses, saldo acumulado e comprometimento futuro.

**Query:** `year`, `userId`

### `GET /api/dashboard/cashflow`
Projeção de fluxo de caixa para 24 meses.

**Query:** `userId`

### `POST /api/dashboard/simulate`
Simula impacto de uma compra/parcelamento/recorrência **sem gravar no banco**.

**Body:** `{ type, description, amount, installmentCount?, startDate?, periodicity?, creditCardId? }`

---

## Cartões de Crédito

### `GET /api/credit-cards`
Lista todos (com `userId` opcional).

### `GET /api/credit-cards/active`
Lista apenas ativos.

### `GET /api/credit-cards/:id`
Detalhe com estatísticas (used, available, usagePercent, purchaseCount, nextInvoiceAmount).

### `POST /api/credit-cards`
Cria cartão. **Body:** name, brand, color, limit, closingDay, dueDay, userId.

### `PUT /api/credit-cards/:id`
Atualiza cartão.

### `PATCH /api/credit-cards/:id/toggle`
Ativa/inativa cartão.

### `DELETE /api/credit-cards/:id`
Exclui cartão.

---

## Contas Bancárias

### `GET /api/bank-accounts`
Lista todas.

### `GET /api/bank-accounts/active`
Lista apenas ativas.

### `GET /api/bank-accounts/transfers`
Lista transferências (com `accountId` opcional).

### `GET /api/bank-accounts/:id`
Detalhe com estatísticas (totalIn, totalOut, totalTransferIn, totalTransferOut).

### `POST /api/bank-accounts`
Cria conta. **Body:** name, type, initialBalance, color, userId.

### `POST /api/bank-accounts/transfer`
Cria transferência. **Body:** fromAccountId, toAccountId, amount, description, date.

### `PUT /api/bank-accounts/:id`
Atualiza conta.

### `DELETE /api/bank-accounts/:id`
Exclui conta.

---

## Contas Fixas

### `GET /api/recurring-expenses`
Lista todas (com `userId` opcional). Inclui `nextDueDate`.

### `GET /api/recurring-expenses/:id`
Detalhe.

### `POST /api/recurring-expenses`
Cria. **Body:** description, amount, periodicity, dueDay, automaticDebit, userId, categoryId, creditCardId?.

### `POST /api/recurring-expenses/generate`
Gera lançamentos do mês/ano informado (idempotente). **Body:** `{ month?, year? }`.

### `PUT /api/recurring-expenses/:id`
Atualiza.

### `DELETE /api/recurring-expenses/:id`
Exclui.

---

## Alertas

### `GET /api/alerts`
Retorna `{ alerts: Alert[], unreadCount: number }`.

### `POST /api/alerts/read`
Marca alertas como lidos. **Body:** `{ ids: string[] }`.

### `POST /api/alerts/dismiss`
Dispensa alertas. **Body:** `{ ids: string[] }`.

### `POST /api/alerts/scan`
Executa varredura de alertas (idempotente — não cria duplicatas no mesmo dia).

---

## Sprint 3

### `GET /api/health-score`
Calcula o índice de saúde financeira (0–100 com grade A–F).

**Query:** `userId`

### `GET /api/assistant/insights`
Gera insights dinâmicos do assistente financeiro.

**Query:** `userId`

### `GET /api/goals`
Lista objetivos financeiros com progresso.

### `GET /api/goals/:id`
Detalhe.

### `POST /api/goals`
Cria. **Body:** title, description?, targetAmount, currentAmount?, deadline?, category, userId.

### `POST /api/goals/:id/contribute`
Adiciona contribuição. **Body:** `{ amount: number }`.

### `PUT /api/goals/:id`
Atualiza.

### `DELETE /api/goals/:id`
Exclui.

### `GET /api/projection`
Projeção financeira de 6 a 36 meses.

**Query:** `months` (6, 12, 24 ou 36), `userId`

### `GET /api/emergency-reserve`
Calcula reserva de emergência.

**Query:** `userId`

### `GET /api/timeline`
Linha do tempo de eventos futuros.

**Query:** `days` (padrão 60), `userId`

### `GET /api/scenarios`
Lista cenários de simulação salvos.

### `GET /api/scenarios/compare`
Compara múltiplos cenários. **Query:** `ids=id1,id2,id3`.

### `GET /api/scenarios/:id`
Detalhe de um cenário.

### `POST /api/scenarios`
Salva cenário. **Body:** name, description?, input, result, userId.

### `DELETE /api/scenarios/:id`
Exclui cenário.

### `GET /api/bank-imports`
Histórico de importações.

### `POST /api/bank-imports`
Importa arquivo bancário. **Body:** bankAccountId, format ("ofx" ou "csv"), content (string), filename, userId.

### `GET /api/executive-dashboard`
Dashboard executivo consolidado (saúde financeira + reserva + insights + saldo + médias + top entidades + objetivos + alertas).

**Query:** `userId`
