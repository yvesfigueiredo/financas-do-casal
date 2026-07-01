import { Router } from "express";
import { InstallmentController } from "../controllers/installment.controller";
import { InstallmentService } from "../services/installment.service";
import { InstallmentRepository } from "../repositories/installment.repository";

const router = Router();

const installmentRepository = new InstallmentRepository();
const installmentService = new InstallmentService(installmentRepository);
const installmentController = new InstallmentController(installmentService);

// GET /installments
router.get("/", installmentController.getAll);

// GET /installments/:id
router.get("/:id", installmentController.getById);

export default router;
