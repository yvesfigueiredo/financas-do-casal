import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { TransactionService } from "../services/transaction.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { InstallmentRepository } from "../repositories/installment.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { UserRepository } from "../repositories/user.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";

const router = Router();

const transactionService = new TransactionService(
  new TransactionRepository(),
  new InstallmentRepository(),
  new CategoryRepository(),
  new UserRepository(),
  new BankAccountRepository()
);

const transactionController = new TransactionController(transactionService);

router.get("/", transactionController.getMany);
router.get("/:id", transactionController.getById);
router.post("/", transactionController.createSimple);
router.post("/installment", transactionController.createInstallment);
router.delete("/installment/:installmentId", transactionController.deleteInstallment);
router.delete("/:id", transactionController.deleteSimple);

export default router;
