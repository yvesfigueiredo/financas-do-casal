import { Router } from "express";
import { BankAccountController } from "../controllers/bank-account.controller";
import { BankAccountService } from "../services/bank-account.service";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { UserRepository } from "../repositories/user.repository";

const router = Router();
const controller = new BankAccountController(
  new BankAccountService(new BankAccountRepository(), new UserRepository())
);

router.get("/", controller.getAll);
router.get("/active", controller.getActive);
router.get("/transfers", controller.getTransfers);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.post("/transfer", controller.createTransfer);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export default router;
