import { Request, Response } from "express";
import { FinancialGoalService } from "../services/financial-goal.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { createFinancialGoalSchema, updateFinancialGoalSchema, addGoalContributionSchema } from "../models/schemas";

export class FinancialGoalController {
  constructor(private readonly service: FinancialGoalService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const goals = await this.service.getAll(userId);
    res.json(successResponse(goals));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const goal = await this.service.getById(req.params.id);
    res.json(successResponse(goal));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createFinancialGoalSchema.parse(req.body);
    const goal = await this.service.create(data);
    res.status(201).json(successResponse(goal, "Objetivo criado com sucesso"));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateFinancialGoalSchema.parse(req.body);
    const goal = await this.service.update(req.params.id, data);
    res.json(successResponse(goal, "Objetivo atualizado"));
  });

  addContribution = asyncHandler(async (req: Request, res: Response) => {
    const { amount } = addGoalContributionSchema.parse(req.body);
    const goal = await this.service.addContribution(req.params.id, amount);
    res.json(successResponse(goal, "Contribuição adicionada"));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(successResponse(null, "Objetivo excluído"));
  });
}
