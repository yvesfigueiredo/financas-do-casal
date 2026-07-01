import { Router } from "express";
import { EmergencyReserveController } from "../controllers/emergency-reserve.controller";
import { EmergencyReserveService } from "../services/emergency-reserve.service";
import { TransactionRepository } from "../repositories/transaction.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";

const router = Router();
const controller = new EmergencyReserveController(
  new EmergencyReserveService(new TransactionRepository(), new BankAccountRepository())
);

router.get("/", controller.get);

export default router;
