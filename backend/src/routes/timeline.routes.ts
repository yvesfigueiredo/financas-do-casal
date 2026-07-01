import { Router } from "express";
import { TimelineController } from "../controllers/timeline.controller";
import { TimelineService } from "../services/timeline.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";

const router = Router();
const controller = new TimelineController(
  new TimelineService(
    new TransactionRepository(),
    new RecurringExpenseRepository(),
    new CreditCardRepository(),
    new BankAccountRepository()
  )
);

router.get("/", controller.get);

export default router;
