import { Request, Response } from "express";
import { EmergencyReserveService } from "../services/emergency-reserve.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class EmergencyReserveController {
  constructor(private readonly service: EmergencyReserveService) {}

  get = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const reserve = await this.service.calculate(userId);
    res.json(successResponse(reserve));
  });
}
