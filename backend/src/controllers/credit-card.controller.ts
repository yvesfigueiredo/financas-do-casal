import { Request, Response } from "express";
import { CreditCardService } from "../services/credit-card.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { createCreditCardSchema, updateCreditCardSchema } from "../models/schemas";

export class CreditCardController {
  constructor(private readonly service: CreditCardService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const cards = await this.service.getAll(userId);
    res.json(successResponse(cards));
  });

  getActive = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const cards = await this.service.getActive(userId);
    res.json(successResponse(cards));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const card = await this.service.getById(req.params.id);
    res.json(successResponse(card));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createCreditCardSchema.parse(req.body);
    const card = await this.service.create(data);
    res.status(201).json(successResponse(card, "Cartão criado com sucesso"));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateCreditCardSchema.parse(req.body);
    const card = await this.service.update(req.params.id, data);
    res.json(successResponse(card, "Cartão atualizado"));
  });

  toggleActive = asyncHandler(async (req: Request, res: Response) => {
    const card = await this.service.toggleActive(req.params.id);
    res.json(successResponse(card, card.active ? "Cartão ativado" : "Cartão inativado"));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(successResponse(null, "Cartão excluído"));
  });
}
