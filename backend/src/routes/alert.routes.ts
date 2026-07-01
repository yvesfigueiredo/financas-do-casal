import { Router } from "express";
import { AlertController } from "../controllers/alert.controller";
import { AlertService } from "../services/alert.service";
import { AlertRepository } from "../repositories/alert.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { TransactionRepository } from "../repositories/transaction.repository";

const router = Router();
const controller = new AlertController(
  new AlertService(
    new AlertRepository(),
    new CreditCardRepository(),
    new RecurringExpenseRepository(),
    new InstallmentRepository(),
    new BankAccountRepository(),
    new TransactionRepository()
  )
);

router.get("/", controller.getAll);
router.post("/read", controller.markRead);
router.post("/dismiss", controller.dismiss);
router.post("/scan", controller.runScan);

export default router;
