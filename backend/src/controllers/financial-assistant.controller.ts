import { Request, Response } from "express";
import { FinancialAssistantService } from "../services/financial-assistant.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class FinancialAssistantController {
  constructor(private readonly service: FinancialAssistantService) {}

  getInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const insights = await this.service.generateInsights(userId);
    res.json(successResponse(insights));
  });
}
