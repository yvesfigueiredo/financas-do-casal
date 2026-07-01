import { Request, Response } from "express";
import { InstallmentService } from "../services/installment.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class InstallmentController {
  constructor(private readonly installmentService: InstallmentService) {}

  // GET /installments
  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const installments = await this.installmentService.getAll();
    res.json(successResponse(installments));
  });

  // GET /installments/:id
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const installment = await this.installmentService.getById(id);
    res.json(successResponse(installment));
  });
}
