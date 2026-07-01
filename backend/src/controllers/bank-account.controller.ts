import { Request, Response } from "express";
import { BankAccountService } from "../services/bank-account.service";
import { asyncHandler, successResponse } from "../utils/errors";
import {
  createBankAccountSchema,
  updateBankAccountSchema,
  createTransferSchema,
} from "../models/schemas";

export class BankAccountController {
  constructor(private readonly service: BankAccountService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const accounts = await this.service.getAll(userId);
    res.json(successResponse(accounts));
  });

  getActive = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const accounts = await this.service.getActive(userId);
    res.json(successResponse(accounts));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const account = await this.service.getById(req.params.id);
    res.json(successResponse(account));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createBankAccountSchema.parse(req.body);
    const account = await this.service.create(data);
    res.status(201).json(successResponse(account, "Conta criada com sucesso"));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateBankAccountSchema.parse(req.body);
    const account = await this.service.update(req.params.id, data);
    res.json(successResponse(account, "Conta atualizada"));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(successResponse(null, "Conta excluída"));
  });

  createTransfer = asyncHandler(async (req: Request, res: Response) => {
    const data = createTransferSchema.parse(req.body);
    const transfer = await this.service.createTransfer(data);
    res.status(201).json(successResponse(transfer, "Transferência realizada"));
  });

  getTransfers = asyncHandler(async (req: Request, res: Response) => {
    const accountId = req.query.accountId as string | undefined;
    const transfers = await this.service.getTransfers(accountId);
    res.json(successResponse(transfers));
  });
}
