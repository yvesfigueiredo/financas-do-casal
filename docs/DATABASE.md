# Database — Finanças do Casal

Documentação completa do banco de dados SQLite.

---

## Engine

- **SQLite** via arquivo `backend/prisma/dev.db` (desenvolvimento) ou caminho configurável via `DATABASE_URL`.
- **ORM:** Prisma 5.x.
- **Migrations:** versionadas em `backend/prisma/migrations/`.

---

## Tabelas

### `users`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | Identificador único |
| `name` | TEXT | UNIQUE NOT NULL | "Yves" ou "Carol" |
| `created_at` | DATETIME | DEFAULT NOW | Data de criação |
| `updated_at` | DATETIME | ON UPDATE | Data de atualização |

### `categories`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `name` | TEXT | UNIQUE NOT NULL | Ex: "Alimentação" |
| `type` | TEXT | NOT NULL | `"income"` ou `"expense"` |

**Valores pré-configurados (seed):**

Despesas: Alimentação, Transporte, Saúde, Educação, Moradia, Lazer, Cartão de Crédito, Boleto, Outros

Receitas: Salário, Freelance, Investimento, Outros Rendimentos

### `installments`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `description` | TEXT | NOT NULL | Nome da compra |
| `total_amount` | REAL | NOT NULL | Valor total |
| `installment_count` | INTEGER | NOT NULL | Número de parcelas |
| `installment_value` | REAL | NOT NULL | Valor por parcela |
| `start_date` | DATETIME | NOT NULL | Data da 1ª parcela |

### `credit_cards`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `name` | TEXT | NOT NULL | Ex: "Nubank Yves" |
| `brand` | TEXT | NOT NULL | Visa/Mastercard/Elo/Amex/Hipercard/Outro |
| `color` | TEXT | NOT NULL | Hex color (#RRGGBB) |
| `limit` | REAL | NOT NULL | Limite de crédito |
| `closing_day` | INTEGER | NOT NULL | Dia de fechamento (1–31) |
| `due_day` | INTEGER | NOT NULL | Dia de vencimento (1–31) |
| `active` | BOOLEAN | DEFAULT true | Ativo/inativo |
| `user_id` | TEXT | FK users.id CASCADE | Titular |

### `bank_accounts`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `name` | TEXT | NOT NULL | Ex: "Nubank Conta" |
| `type` | TEXT | NOT NULL | bank/wallet/checking/savings/digital |
| `initial_balance` | REAL | DEFAULT 0 | Saldo no momento da criação |
| `current_balance` | REAL | DEFAULT 0 | Saldo atual (atualizado incrementalmente) |
| `color` | TEXT | DEFAULT '#0ea5e9' | Hex color |
| `active` | BOOLEAN | DEFAULT true | |
| `user_id` | TEXT | FK users.id CASCADE | Titular |

### `transfers`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `amount` | REAL | NOT NULL | Valor transferido |
| `description` | TEXT | NOT NULL | Descrição |
| `date` | DATETIME | NOT NULL | Data da transferência |
| `from_account_id` | TEXT | FK bank_accounts.id | Conta de origem |
| `to_account_id` | TEXT | FK bank_accounts.id | Conta de destino |

### `recurring_expenses`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `description` | TEXT | NOT NULL | Ex: "Aluguel" |
| `amount` | REAL | NOT NULL | Valor |
| `periodicity` | TEXT | NOT NULL | monthly/weekly/biweekly/quarterly/semiannual/annual |
| `due_day` | INTEGER | NOT NULL | Dia de vencimento (1–31) |
| `automatic_debit` | BOOLEAN | DEFAULT false | Débito automático? |
| `active` | BOOLEAN | DEFAULT true | |
| `last_generated` | DATETIME | NULL | Data da última geração de lançamento |
| `user_id` | TEXT | FK users.id CASCADE | Titular |
| `category_id` | TEXT | FK categories.id | Categoria |
| `credit_card_id` | TEXT | FK credit_cards.id NULL | Cartão vinculado (opcional) |

### `transactions`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `description` | TEXT | NOT NULL | |
| `amount` | REAL | NOT NULL | Valor positivo sempre |
| `type` | TEXT | NOT NULL | `"income"` ou `"expense"` |
| `date` | DATETIME | NOT NULL | Data do lançamento |
| `payment_method` | TEXT | DEFAULT 'cash' | cash/pix/debit/credit |
| `installment_number` | INTEGER | NULL | Número da parcela (1-based) |
| `installment_total` | INTEGER | NULL | Total de parcelas |
| `user_id` | TEXT | FK users.id CASCADE | Responsável |
| `category_id` | TEXT | FK categories.id | Categoria |
| `installment_id` | TEXT | FK installments.id CASCADE NULL | Parcelamento pai |
| `credit_card_id` | TEXT | FK credit_cards.id NULL | Cartão de crédito |
| `bank_account_id` | TEXT | FK bank_accounts.id NULL | Conta bancária |
| `recurring_expense_id` | TEXT | FK recurring_expenses.id NULL | Recorrência que gerou este lançamento |

### `alerts`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `type` | TEXT | NOT NULL | Ver tipos abaixo |
| `title` | TEXT | NOT NULL | Título do alerta |
| `message` | TEXT | NOT NULL | Mensagem detalhada |
| `read` | BOOLEAN | DEFAULT false | |
| `dismissed` | BOOLEAN | DEFAULT false | |
| `due_date` | DATETIME | NULL | Data de vencimento relacionada |
| `credit_card_id` | TEXT | NULL | Referência opcional |
| `recurring_expense_id` | TEXT | NULL | Referência opcional |
| `installment_id` | TEXT | NULL | Referência opcional |

**Tipos de alerta:** `bill_due_tomorrow`, `card_closing_tomorrow`, `invoice_due`, `negative_balance`, `card_limit_high`, `recurring_unpaid`, `installment_ending`

### `financial_goals`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `title` | TEXT | NOT NULL | Ex: "Reserva de Emergência" |
| `description` | TEXT | NULL | Opcional |
| `target_amount` | REAL | NOT NULL | Valor alvo |
| `current_amount` | REAL | DEFAULT 0 | Valor atual acumulado |
| `deadline` | DATETIME | NULL | Prazo opcional |
| `category` | TEXT | DEFAULT 'savings' | savings/investment/debt/purchase/emergency |
| `active` | BOOLEAN | DEFAULT true | |
| `user_id` | TEXT | FK users.id CASCADE | Titular |

### `simulation_scenarios`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `name` | TEXT | NOT NULL | Nome do cenário |
| `description` | TEXT | NULL | Opcional |
| `input_json` | TEXT | NOT NULL | JSON do input da simulação |
| `result_json` | TEXT | NOT NULL | JSON do resultado da simulação |
| `user_id` | TEXT | FK users.id CASCADE | Quem salvou |

### `bank_imports`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | TEXT | PK, CUID | |
| `filename` | TEXT | NOT NULL | Nome do arquivo importado |
| `format` | TEXT | NOT NULL | `"ofx"` ou `"csv"` |
| `status` | TEXT | DEFAULT 'pending' | pending/processed/failed |
| `total_rows` | INTEGER | DEFAULT 0 | Total de linhas no arquivo |
| `imported_rows` | INTEGER | DEFAULT 0 | Lançamentos criados |
| `duplicate_rows` | INTEGER | DEFAULT 0 | Duplicatas ignoradas |
| `error_message` | TEXT | NULL | Mensagem em caso de falha |
| `bank_account_id` | TEXT | FK bank_accounts.id | Conta de destino |

---

## Relacionamentos

```
users ──< credit_cards
users ──< bank_accounts
users ──< recurring_expenses
users ──< transactions
users ──< financial_goals
users ──< simulation_scenarios

categories ──< transactions
categories ──< recurring_expenses

installments ──< transactions (cascade delete)

credit_cards ──< transactions
credit_cards ──< recurring_expenses

bank_accounts ──< transactions
bank_accounts ──< transfers (from)
bank_accounts ──< transfers (to)
bank_accounts ──< bank_imports

recurring_expenses ──< transactions
```

---

## Migrations

| Arquivo | Conteúdo |
|---|---|
| `20240101000000_init/migration.sql` | Criação de todas as 9 tabelas originais (Sprint 1 + Sprint 2) |
| `20240102000000_sprint3/migration.sql` | 3 novas tabelas Sprint 3: financial_goals, simulation_scenarios, bank_imports |
| `migration_lock.toml` | Declaração do provider SQLite (não editar manualmente) |

---

## Seed

O arquivo `backend/prisma/seed.ts` cria:

1. Usuários: Yves, Carol
2. 9 categorias de despesa + 4 de receita
3. 3 cartões de crédito (Nubank Yves, Inter Yves, Itaú Carol)
4. 3 contas bancárias (Nubank, Caixa, BB Conjunta)
5. 4 contas fixas (Aluguel, Internet, Academia, Seguro)
6. 6 lançamentos simples do mês atual (2 receitas, 4 despesas)
7. 3 parcelamentos com todas as parcelas (Notebook 10x, Curso 6x, TV 12x)
8. 2 objetivos financeiros (Reserva de Emergência, Viagem para Europa)
