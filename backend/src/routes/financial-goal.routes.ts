import { Router } from "express";
import { FinancialGoalController } from "../controllers/financial-goal.controller";
import { FinancialGoalService } from "../services/financial-goal.service";
import { FinancialGoalRepository } from "../repositories/financial-goal.repository";
import { UserRepository } from "../repositories/user.repository";

const router = Router();
const controller = new FinancialGoalController(
  new FinancialGoalService(new FinancialGoalRepository(), new UserRepository())
);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.post("/:id/contribute", controller.addContribution);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
