import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { DashboardService } from "../services/dashboard.service";
import { SimulationService } from "../services/simulation.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";

const router = Router();

const transactionRepo = new TransactionRepository();
const cardRepo = new CreditCardRepository();
const recurringRepo = new RecurringExpenseRepository();

const controller = new DashboardController(
  new DashboardService(transactionRepo, cardRepo, recurringRepo),
  new SimulationService(transactionRepo, cardRepo, recurringRepo)
);

router.get("/", controller.getSummary);
router.get("/annual", controller.getAnnual);
router.get("/cashflow", controller.getCashFlow);
router.post("/simulate", controller.simulate);

export default router;
