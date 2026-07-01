import { Request, Response } from "express";
import { ExecutiveDashboardService } from "../services/executive-dashboard.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class ExecutiveDashboardController {
  constructor(private readonly service: ExecutiveDashboardService) {}

  get = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const dashboard = await this.service.get(userId);
    res.json(successResponse(dashboard));
  });
}
