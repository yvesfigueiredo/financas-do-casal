import { Router } from "express";
import { FinancialAssistantController } from "../controllers/financial-assistant.controller";
import { FinancialAssistantService } from "../services/financial-assistant.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";

const router = Router();
const controller = new FinancialAssistantController(
  new FinancialAssistantService(
    new TransactionRepository(),
    new CreditCardRepository(),
    new InstallmentRepository(),
    new FinancialGoalRepository()
  )
);

router.get("/insights", controller.getInsights);

export default router;
