// ============================================================
// MODELOS DE DOMÍNIO - Finanças do Casal (Sprint 1 + 2)
// ============================================================

export type UserName = "Yves" | "Carol";
export type TransactionType = "income" | "expense";
export type CategoryType = "income" | "expense";
export type PaymentMethod = "cash" | "pix" | "debit" | "credit";
export type CardBrand = "Visa" | "Mastercard" | "Elo" | "Amex" | "Hipercard" | "Outro";
export type AccountType = "bank" | "wallet" | "checking" | "savings" | "digital";
export type Periodicity = "monthly" | "weekly" | "biweekly" | "quarterly" | "semiannual" | "annual";
export type AlertType =
  | "bill_due_tomorrow"
  | "card_closing_tomorrow"
  | "invoice_due"
  | "negative_balance"
  | "card_limit_high"
  | "recurring_unpaid"
  | "installment_ending";

// ============================================================
// USER
// ============================================================

export interface User {
  id: string;
  name: UserName;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CATEGORY
// ============================================================

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// INSTALLMENT
// ============================================================

export interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  installmentCount: number;
  installmentValue: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
  transactions?: TransactionWithRelations[];
}

export interface InstallmentWithProgress extends Installment {
  paidCount: number;
  pendingCount: number;
  paidAmount: number;
  pendingAmount: number;
  userName: string;
  categoryName: string;
}

// ============================================================
// CREDIT CARD
// ============================================================

export interface CreditCard {
  id: string;
  name: string;
  brand: CardBrand;
  color: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
}

export interface CreditCardWithStats extends CreditCard {
  used: number;
  available: number;
  usagePercent: number;
  purchaseCount: number;
  nextInvoiceAmount: number;
}

export interface CreateCreditCardDTO {
  name: string;
  brand: CardBrand;
  color: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  userId: string;
}

export interface UpdateCreditCardDTO {
  name?: string;
  brand?: CardBrand;
  color?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  active?: boolean;
}

// ============================================================
// BANK ACCOUNT
// ============================================================

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
}

export interface BankAccountWithStats extends BankAccount {
  totalIn: number;
  totalOut: number;
  totalTransferIn: number;
  totalTransferOut: number;
}

export interface CreateBankAccountDTO {
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  userId: string;
}

export interface UpdateBankAccountDTO {
  name?: string;
  type?: AccountType;
  color?: string;
  active?: boolean;
}

export interface CreateTransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
}

export interface Transfer {
  id: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  fromAccountId: string;
  toAccountId: string;
  fromAccount?: BankAccount;
  toAccount?: BankAccount;
}

// ============================================================
// RECURRING EXPENSE
// ============================================================

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  periodicity: Periodicity;
  dueDay: number;
  automaticDebit: boolean;
  active: boolean;
  lastGenerated: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId: string;
  creditCardId: string | null;
  user?: User;
  category?: Category;
  creditCard?: CreditCard | null;
}

export interface RecurringExpenseWithNext extends RecurringExpense {
  nextDueDate: Date;
  nextGenerationDate: Date | null;
}

export interface CreateRecurringExpenseDTO {
  description: string;
  amount: number;
  periodicity: Periodicity;
  dueDay: number;
  automaticDebit: boolean;
  userId: string;
  categoryId: string;
  creditCardId?: string;
}

export interface UpdateRecurringExpenseDTO {
  description?: string;
  amount?: number;
  periodicity?: Periodicity;
  dueDay?: number;
  automaticDebit?: boolean;
  active?: boolean;
  categoryId?: string;
  creditCardId?: string | null;
}

// ============================================================
// TRANSACTION (Sprint 2 — campos adicionais)
// ============================================================

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
  paymentMethod: PaymentMethod;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId: string;
  installmentId: string | null;
  creditCardId: string | null;
  bankAccountId: string | null;
  recurringExpenseId: string | null;
}

export interface TransactionWithRelations extends Transaction {
  user: User;
  category: Category;
  installment?: Installment | null;
  creditCard?: CreditCard | null;
  bankAccount?: BankAccount | null;
  recurringExpense?: RecurringExpense | null;
}

// ============================================================
// DTOs DE ENTRADA - TRANSACTION
// ============================================================

export interface CreateTransactionDTO {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  paymentMethod?: PaymentMethod;
  userId: string;
  categoryId: string;
  creditCardId?: string;
  bankAccountId?: string;
}

export interface CreateInstallmentTransactionDTO {
  description: string;
  totalAmount: number;
  installmentCount: number;
  startDate: string;
  paymentMethod?: PaymentMethod;
  userId: string;
  categoryId: string;
  creditCardId?: string;
  bankAccountId?: string;
}

export interface TransactionFilters {
  userId?: string;
  month?: number;
  year?: number;
  type?: TransactionType;
  categoryId?: string;
  creditCardId?: string;
  bankAccountId?: string;
  page?: number;
  limit?: number;
}

// ============================================================
// ALERT
// ============================================================

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  read: boolean;
  dismissed: boolean;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creditCardId: string | null;
  recurringExpenseId: string | null;
  installmentId: string | null;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCreditLimit: number;
  totalCreditUsed: number;
  totalCreditAvailable: number;
  byCategory: CategorySummary[];
  byUser: UserSummary[];
  byCard: CardSummary[];
  upcomingInstallments: UpcomingInstallmentSummary[];
  nextInvoices: NextInvoiceSummary[];
  topCategory: string | null;
  topCard: string | null;
  balanceForecast: number;
  committedInstallments: number;
  committedRecurring: number;
  nextBill: { description: string; amount: number; dueDate: Date } | null;
  nextInvoice: { cardName: string; amount: number; dueDate: Date } | null;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

export interface UserSummary {
  userId: string;
  userName: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CardSummary {
  cardId: string;
  cardName: string;
  brand: string;
  color: string;
  total: number;
  percentage: number;
}

export interface NextInvoiceSummary {
  cardId: string;
  cardName: string;
  brand: string;
  color: string;
  dueDay: number;
  amount: number;
}

export interface UpcomingInstallmentSummary {
  month: number;
  year: number;
  monthLabel: string;
  totalAmount: number;
  installments: {
    description: string;
    amount: number;
    installmentNumber: number;
    installmentTotal: number;
  }[];
}

// ============================================================
// DASHBOARD ANUAL
// ============================================================

export interface AnnualSummary {
  year: number;
  months: MonthSummary[];
  accumulatedBalance: AccumulatedMonth[];
  futureCommitment: FutureCommitmentMonth[];
}

export interface MonthSummary {
  month: number;
  monthLabel: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface AccumulatedMonth {
  month: number;
  monthLabel: string;
  balance: number;
}

export interface FutureCommitmentMonth {
  month: number;
  year: number;
  monthLabel: string;
  installments: number;
  recurring: number;
  total: number;
}

// ============================================================
// FLUXO DE CAIXA
// ============================================================

export interface CashFlowMonth {
  month: number;
  year: number;
  monthLabel: string;
  openingBalance: number;
  income: number;
  expenses: number;
  installments: number;
  recurring: number;
  transfers: number;
  closingBalance: number;
}

// ============================================================
// SIMULAÇÃO
// ============================================================

export interface SimulationInput {
  type: "purchase" | "installment" | "recurring";
  description: string;
  amount: number;
  installmentCount?: number;
  startDate?: string;
  periodicity?: Periodicity;
  creditCardId?: string;
}

export interface SimulationResult {
  input: SimulationInput;
  monthlyImpact: SimulationMonth[];
  totalImpact: number;
  cardImpact: { cardId: string; cardName: string; newUsed: number; newAvailable: number } | null;
}

export interface SimulationMonth {
  month: number;
  year: number;
  monthLabel: string;
  impact: number;
  projectedBalance: number;
}

// ============================================================
// UTILITÁRIO GERAL
// ============================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ============================================================
// SPRINT 3 — NOVOS TIPOS
// ============================================================

export type GoalCategory = "savings" | "investment" | "debt" | "purchase" | "emergency";
export type ImportFormat = "ofx" | "csv";
export type ImportStatus = "pending" | "processed" | "failed";

// ============================================================
// OBJETIVOS FINANCEIROS
// ============================================================

export interface FinancialGoal {
  id: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  category: GoalCategory;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
}

export interface FinancialGoalWithProgress extends FinancialGoal {
  progressPercent: number;
  remainingAmount: number;
  projectedCompletionDate: Date | null;
  monthsToComplete: number | null;
  isOnTrack: boolean;
}

export interface CreateFinancialGoalDTO {
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  category: GoalCategory;
  userId: string;
}

export interface UpdateFinancialGoalDTO {
  title?: string;
  description?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string | null;
  category?: GoalCategory;
  active?: boolean;
}

// ============================================================
// CENÁRIOS DE SIMULAÇÃO
// ============================================================

export interface SimulationScenario {
  id: string;
  name: string;
  description: string | null;
  inputJson: string;
  resultJson: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user?: User;
  // Parsed
  input?: SimulationInput;
  result?: SimulationResult;
}

export interface SaveScenarioDTO {
  name: string;
  description?: string;
  input: SimulationInput;
  result: SimulationResult;
  userId: string;
}

// ============================================================
// IMPORTAÇÃO BANCÁRIA
// ============================================================

export interface BankImport {
  id: string;
  filename: string;
  format: ImportFormat;
  status: ImportStatus;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  bankAccountId: string;
}

export interface ParsedImportRow {
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  originalId?: string; // ID do banco (para detecção de duplicatas)
}

// ============================================================
// ÍNDICE DE SAÚDE FINANCEIRA
// ============================================================

export interface HealthScore {
  score: number;           // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  breakdown: HealthCriteria[];
  recommendations: HealthRecommendation[];
  calculatedAt: Date;
}

export interface HealthCriteria {
  name: string;
  score: number;      // 0–100 para este critério
  weight: number;     // peso percentual
  contribution: number; // score * weight / 100
  status: "good" | "warning" | "danger";
  detail: string;
}

export interface HealthRecommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  impact: string;
}

// ============================================================
// ASSISTENTE FINANCEIRO
// ============================================================

export interface FinancialInsight {
  id: string;
  type: "spending_increase" | "category_alert" | "card_usage" | "installment_load" | "positive_trend" | "goal_progress" | "savings_opportunity";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "positive";
  data: Record<string, number | string>;
  recommendation: string;
  generatedAt: Date;
}

// ============================================================
// PROJEÇÃO FINANCEIRA
// ============================================================

export interface FinancialProjection {
  months: ProjectionMonth[];
  summary: {
    projectedBalanceAt6m: number;
    projectedBalanceAt12m: number;
    projectedBalanceAt24m: number;
    projectedBalanceAt36m: number;
    averageMonthlyIncome: number;
    averageMonthlyExpense: number;
    averageMonthlySavings: number;
    totalInstallmentCommitment: number;
    totalRecurringCommitment: number;
  };
}

export interface ProjectionMonth {
  month: number;
  year: number;
  monthLabel: string;
  projectedIncome: number;
  projectedExpense: number;
  projectedInstallments: number;
  projectedRecurring: number;
  projectedBalance: number;
  runningBalance: number;
  goalContributions: number;
}

// ============================================================
// LINHA DO TEMPO
// ============================================================

export interface TimelineEvent {
  id: string;
  date: Date;
  dateLabel: string;
  title: string;
  amount: number;
  type: "income" | "expense" | "installment" | "recurring" | "invoice" | "goal" | "transfer";
  category: string;
  userName: string;
  projectedBalance: number;
  cardName?: string;
  installmentInfo?: string;
}

// ============================================================
// RESERVA DE EMERGÊNCIA
// ============================================================

export interface EmergencyReserve {
  monthlyExpenses: number;         // média de despesas mensais
  currentReserve: number;          // saldo atual das contas
  monthsProtected: number;         // meses cobertos
  targetMonths: number;            // meta (6 meses recomendado)
  targetAmount: number;            // valor alvo
  isAdequate: boolean;
  shortfall: number;               // quanto falta
  healthStatus: "critical" | "insufficient" | "adequate" | "excellent";
}

// ============================================================
// DASHBOARD EXECUTIVO (Sprint 3 — Funcionalidade 3)
// ============================================================

export interface ExecutiveDashboard {
  healthScore: HealthScore;
  emergencyReserve: EmergencyReserve;
  balance: {
    current: number;
    forecast: number;
  };
  averages: {
    income: number;
    expense: number;
    savings: number;
  };
  topEntities: {
    category: { name: string; amount: number } | null;
    card: { name: string; amount: number } | null;
    bankAccount: { name: string; balance: number } | null;
    recurringExpense: { description: string; amount: number } | null;
  };
  goalsSummary: {
    total: number;
    onTrack: number;
    atRisk: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
  };
  insightsCount: {
    critical: number;
    warning: number;
    positive: number;
  };
  alertsCount: number;
}
