import { Router } from "express";
import { ExecutiveDashboardController } from "../controllers/executive-dashboard.controller";
import { ExecutiveDashboardService } from "../services/executive-dashboard.service";
import { HealthScoreService } from "../services/health-score.service";
import { EmergencyReserveService } from "../services/emergency-reserve.service";
import { FinancialAssistantService } from "../services/financial-assistant.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";
import { AlertRepository } from "../repositories/alert.repository";

const router = Router();

const transactionRepo = new TransactionRepository();
const cardRepo = new CreditCardRepository();
const accountRepo = new BankAccountRepository();
const recurringRepo = new RecurringExpenseRepository();
const installmentRepo = new InstallmentRepository();
const goalRepo = new FinancialGoalRepository();
const alertRepo = new AlertRepository();

const controller = new ExecutiveDashboardController(
  new ExecutiveDashboardService(
    new HealthScoreService(transactionRepo, cardRepo, recurringRepo, installmentRepo, accountRepo),
    new EmergencyReserveService(transactionRepo, accountRepo),
    new FinancialAssistantService(transactionRepo, cardRepo, installmentRepo, goalRepo),
    transactionRepo,
    cardRepo,
    accountRepo,
    recurringRepo,
    goalRepo,
    alertRepo
  )
);

router.get("/", controller.get);

export default router;
