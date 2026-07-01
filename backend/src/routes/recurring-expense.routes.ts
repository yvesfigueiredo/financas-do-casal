import { Router } from "express";
import { RecurringExpenseController } from "../controllers/recurring-expense.controller";
import { RecurringExpenseService } from "../services/recurring-expense.service";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { UserRepository } from "../repositories/user.repository";

const router = Router();
const controller = new RecurringExpenseController(
  new RecurringExpenseService(
    new RecurringExpenseRepository(),
    new TransactionRepository(),
    new CategoryRepository(),
    new UserRepository()
  )
);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.post("/generate", controller.generateForMonth);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
