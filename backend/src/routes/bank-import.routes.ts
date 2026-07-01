import { Router } from "express";
import { BankImportController } from "../controllers/bank-import.controller";
import { BankImportService } from "../services/bank-import.service";
import { BankImportRepository } from "../repositories/bank-import.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";

const router = Router();
const controller = new BankImportController(
  new BankImportService(
    new BankImportRepository(),
    new TransactionRepository(),
    new CategoryRepository(),
    new BankAccountRepository()
  )
);

router.get("/", controller.getAll);
router.post("/", controller.import);

export default router;
