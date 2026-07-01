import { Request, Response } from "express";
import { TransactionService } from "../services/transaction.service";
import { asyncHandler, successResponse } from "../utils/errors";
import {
  createInstallmentTransactionSchema,
  createTransactionSchema,
  transactionFiltersSchema,
} from "../models/schemas";

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // GET /transactions
  getMany = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = transactionFiltersSchema.parse(req.query);
    const result = await this.transactionService.getMany(filters);
    res.json(successResponse(result));
  });

  // GET /transactions/:id
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const transaction = await this.transactionService.getById(id);
    res.json(successResponse(transaction));
  });

  // POST /transactions
  createSimple = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const data = createTransactionSchema.parse(req.body);
      const transaction = await this.transactionService.createSimple(data);
      res.status(201).json(successResponse(transaction, "Lançamento criado com sucesso"));
    }
  );

  // POST /transactions/installment
  createInstallment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const data = createInstallmentTransactionSchema.parse(req.body);
      const result = await this.transactionService.createInstallment(data);
      res.status(201).json(
        successResponse(
          result,
          `Parcelamento criado com ${result.transactionsCreated} parcelas`
        )
      );
    }
  );

  // DELETE /transactions/:id
  deleteSimple = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      await this.transactionService.deleteSimple(id);
      res.json(successResponse(null, "Lançamento excluído com sucesso"));
    }
  );

  // DELETE /transactions/installment/:installmentId
  deleteInstallment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { installmentId } = req.params;
      await this.transactionService.deleteInstallment(installmentId);
      res.json(
        successResponse(null, "Parcelamento e todas as parcelas excluídos")
      );
    }
  );
}
