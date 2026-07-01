import { Router } from "express";
import { ScenarioController } from "../controllers/scenario.controller";
import { ScenarioService } from "../services/scenario.service";
import { SimulationService } from "../services/simulation.service";
import { ScenarioRepository } from "../repositories/scenario.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { RecurringExpenseRepository } from "../repositories/recurring-expense.repository";

const router = Router();

const transactionRepo = new TransactionRepository();
const cardRepo = new CreditCardRepository();
const recurringRepo = new RecurringExpenseRepository();

const controller = new ScenarioController(
  new ScenarioService(
    new ScenarioRepository(),
    new SimulationService(transactionRepo, cardRepo, recurringRepo)
  )
);

router.get("/", controller.getAll);
router.get("/compare", controller.compare);
router.get("/:id", controller.getById);
router.post("/", controller.save);
router.post("/:id/rerun", controller.rerun);
router.delete("/:id", controller.delete);

export default router;
