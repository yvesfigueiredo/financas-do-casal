import { z } from "zod";

// ============================================================
// TRANSAÇÃO SIMPLES (Sprint 1 + novos campos Sprint 2)
// ============================================================

export const createTransactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(255),
  amount: z.number().positive("Valor deve ser positivo").max(9999999),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Tipo deve ser 'income' ou 'expense'" }),
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  paymentMethod: z.enum(["cash", "pix", "debit", "credit"]).optional().default("cash"),
  userId: z.string().min(1, "Usuário é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  creditCardId: z.string().optional(),
  bankAccountId: z.string().optional(),
});

// ============================================================
// TRANSAÇÃO PARCELADA
// ============================================================

export const createInstallmentTransactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(255),
  totalAmount: z.number().positive("Valor total deve ser positivo").max(9999999),
  installmentCount: z.number().int().min(2, "Mínimo 2 parcelas").max(120, "Máximo 120 parcelas"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Data de início inválida"),
  paymentMethod: z.enum(["cash", "pix", "debit", "credit"]).optional().default("credit"),
  userId: z.string().min(1, "Usuário é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  creditCardId: z.string().optional(),
  bankAccountId: z.string().optional(),
});

// ============================================================
// FILTROS DE TRANSAÇÕES
// ============================================================

export const transactionFiltersSchema = z.object({
  month: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1 && val <= 12), "Mês deve ser entre 1 e 12"),
  year: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 2000 && val <= 2100), "Ano inválido"),
  userId: z.string().optional(),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().optional(),
  creditCardId: z.string().optional(),
  bankAccountId: z.string().optional(),
  page: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, "Página deve ser pelo menos 1"),
  limit: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, "Limite deve ser entre 1 e 100"),
});

// ============================================================
// FILTROS DO DASHBOARD
// ============================================================

export const dashboardFiltersSchema = z.object({
  month: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 1 && val <= 12), "Mês deve ser entre 1 e 12"),
  year: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (val >= 2000 && val <= 2100), "Ano inválido"),
  userId: z.string().optional(),
});

// ============================================================
// CARTÃO DE CRÉDITO
// ============================================================

export const createCreditCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  brand: z.enum(["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outro"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hex válido"),
  limit: z.number().positive("Limite deve ser positivo").max(999999),
  closingDay: z.number().int().min(1).max(31, "Dia de fechamento deve ser entre 1 e 31"),
  dueDay: z.number().int().min(1).max(31, "Dia de vencimento deve ser entre 1 e 31"),
  userId: z.string().min(1, "Usuário é obrigatório"),
});

export const updateCreditCardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  brand: z.enum(["Visa", "Mastercard", "Elo", "Amex", "Hipercard", "Outro"]).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  limit: z.number().positive().max(999999).optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  active: z.boolean().optional(),
});

// ============================================================
// CONTA BANCÁRIA
// ============================================================

export const createBankAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["bank", "wallet", "checking", "savings", "digital"]),
  initialBalance: z.number().max(99999999),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hex válido"),
  userId: z.string().min(1, "Usuário é obrigatório"),
});

export const updateBankAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["bank", "wallet", "checking", "savings", "digital"]).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  active: z.boolean().optional(),
});

export const createTransferSchema = z.object({
  fromAccountId: z.string().min(1, "Conta de origem obrigatória"),
  toAccountId: z.string().min(1, "Conta de destino obrigatória"),
  amount: z.number().positive("Valor deve ser positivo"),
  description: z.string().min(1, "Descrição obrigatória").max(255),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
});

// ============================================================
// DESPESA RECORRENTE
// ============================================================

export const createRecurringExpenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(255),
  amount: z.number().positive("Valor deve ser positivo").max(9999999),
  periodicity: z.enum(["monthly", "weekly", "biweekly", "quarterly", "semiannual", "annual"]),
  dueDay: z.number().int().min(1).max(31, "Dia de vencimento deve ser entre 1 e 31"),
  automaticDebit: z.boolean().default(false),
  userId: z.string().min(1, "Usuário é obrigatório"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  creditCardId: z.string().optional(),
});

export const updateRecurringExpenseSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().positive().max(9999999).optional(),
  periodicity: z.enum(["monthly", "weekly", "biweekly", "quarterly", "semiannual", "annual"]).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  automaticDebit: z.boolean().optional(),
  active: z.boolean().optional(),
  categoryId: z.string().optional(),
  creditCardId: z.string().nullable().optional(),
});

// ============================================================
// SIMULAÇÃO
// ============================================================

export const simulationSchema = z.object({
  type: z.enum(["purchase", "installment", "recurring"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  installmentCount: z.number().int().min(2).max(120).optional(),
  startDate: z.string().optional(),
  periodicity: z.enum(["monthly", "weekly", "biweekly", "quarterly", "semiannual", "annual"]).optional(),
  creditCardId: z.string().optional(),
});

// ============================================================
// ALERTAS
// ============================================================

export const markAlertReadSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// ============================================================
// DASHBOARD ANUAL
// ============================================================

export const annualFiltersSchema = z.object({
  year: z
    .string().optional()
    .transform((val) => (val ? parseInt(val, 10) : new Date().getFullYear()))
    .refine((val) => val >= 2000 && val <= 2100, "Ano inválido"),
  userId: z.string().optional(),
});

// ============================================================
// TYPES
// ============================================================

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateInstallmentTransactionInput = z.infer<typeof createInstallmentTransactionSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;
export type SimulationInput = z.infer<typeof simulationSchema>;
export type AnnualFiltersInput = z.infer<typeof annualFiltersSchema>;

// ============================================================
// SPRINT 3 — SCHEMAS ZOD
// ============================================================

export const createFinancialGoalSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive("Valor alvo deve ser positivo"),
  currentAmount: z.number().min(0).optional().default(0),
  deadline: z.string().refine((v) => !isNaN(Date.parse(v)), "Data inválida").optional(),
  category: z.enum(["savings", "investment", "debt", "purchase", "emergency"]),
  userId: z.string().min(1, "Usuário obrigatório"),
});

export const updateFinancialGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().nullable().optional(),
  category: z.enum(["savings", "investment", "debt", "purchase", "emergency"]).optional(),
  active: z.boolean().optional(),
});

export const addGoalContributionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
});

export const saveScenarioSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  description: z.string().max(500).optional(),
  input: z.object({
    type: z.enum(["purchase", "installment", "recurring"]),
    description: z.string(),
    amount: z.number().positive(),
    installmentCount: z.number().int().min(2).max(120).optional(),
    startDate: z.string().optional(),
    periodicity: z.enum(["monthly", "weekly", "biweekly", "quarterly", "semiannual", "annual"]).optional(),
    creditCardId: z.string().optional(),
  }),
  result: z.object({}).passthrough(),
  userId: z.string().min(1),
});

export const projectionFiltersSchema = z.object({
  months: z
    .string().optional()
    .transform((v) => (v ? parseInt(v, 10) : 36))
    .refine((v) => [6, 12, 24, 36].includes(v), "Meses deve ser 6, 12, 24 ou 36"),
  userId: z.string().optional(),
});

export const bankImportSchema = z.object({
  bankAccountId: z.string().min(1, "Conta bancária obrigatória"),
  format: z.enum(["ofx", "csv"]),
  content: z.string().min(1, "Conteúdo do arquivo obrigatório"),
});

export type CreateFinancialGoalInput = z.infer<typeof createFinancialGoalSchema>;
export type UpdateFinancialGoalInput = z.infer<typeof updateFinancialGoalSchema>;
export type SaveScenarioInput = z.infer<typeof saveScenarioSchema>;
export type ProjectionFiltersInput = z.infer<typeof projectionFiltersSchema>;
export type BankImportInput = z.infer<typeof bankImportSchema>;
