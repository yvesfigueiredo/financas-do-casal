import { Router } from "express";
import { ProjectionController } from "../controllers/projection.controller";
import { ProjectionService } from "../services/projection.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";

const router = Router();
const controller = new ProjectionController(
  new ProjectionService(
    new TransactionRepository(),
    new RecurringExpenseRepository(),
    new BankAccountRepository(),
    new FinancialGoalRepository()
  )
);

router.get("/", controller.get);

export default router;
