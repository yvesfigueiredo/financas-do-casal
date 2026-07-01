import { Request, Response } from "express";
import { TimelineService } from "../services/timeline.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class TimelineController {
  constructor(private readonly service: TimelineService) {}

  get = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 60;
    const timeline = await this.service.getTimeline(days, userId);
    res.json(successResponse(timeline));
  });
}
