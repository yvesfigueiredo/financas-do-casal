import { Request, Response } from "express";
import { HealthScoreService } from "../services/health-score.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class HealthScoreController {
  constructor(private readonly service: HealthScoreService) {}

  get = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const score = await this.service.calculate(userId);
    res.json(successResponse(score));
  });
}
