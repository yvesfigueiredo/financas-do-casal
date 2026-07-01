import { Router } from "express";
import { HealthScoreController } from "../controllers/health-score.controller";
import { HealthScoreService } from "../services/health-score.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";

const router = Router();
const controller = new HealthScoreController(
  new HealthScoreService(
    new TransactionRepository(),
    new CreditCardRepository(),
    new RecurringExpenseRepository(),
    new InstallmentRepository(),
    new BankAccountRepository()
  )
);

router.get("/", controller.get);

export default router;
