import { Request, Response } from "express";
import { ProjectionService } from "../services/projection.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { projectionFiltersSchema } from "../models/schemas";

export class ProjectionController {
  constructor(private readonly service: ProjectionService) {}

  get = asyncHandler(async (req: Request, res: Response) => {
    const filters = projectionFiltersSchema.parse(req.query);
    const projection = await this.service.project(filters.months, filters.userId);
    res.json(successResponse(projection));
  });
}
