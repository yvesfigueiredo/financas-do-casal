import { Router } from "express";
import { CreditCardController } from "../controllers/credit-card.controller";
import { CreditCardService } from "../services/credit-card.service";
import { CreditCardRepository } from "../repositories/credit-card.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { UserRepository } from "../repositories/user.repository";

const router = Router();
const controller = new CreditCardController(
  new CreditCardService(new CreditCardRepository(), new TransactionRepository(), new UserRepository())
);

router.get("/", controller.getAll);
router.get("/active", controller.getActive);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.patch("/:id/toggle", controller.toggleActive);
router.delete("/:id", controller.delete);

export default router;
