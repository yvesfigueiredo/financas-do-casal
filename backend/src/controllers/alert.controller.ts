import { Request, Response } from "express";
import { AlertService } from "../services/alert.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { markAlertReadSchema } from "../models/schemas";

export class AlertController {
  constructor(private readonly service: AlertService) {}

  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const result = await this.service.getAll();
    res.json(successResponse(result));
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = markAlertReadSchema.parse(req.body);
    await this.service.markRead(ids);
    res.json(successResponse(null, "Alertas marcados como lidos"));
  });

  dismiss = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = markAlertReadSchema.parse(req.body);
    await this.service.dismiss(ids);
    res.json(successResponse(null, "Alertas dispensados"));
  });

  runScan = asyncHandler(async (_req: Request, res: Response) => {
    await this.service.runAlertScan();
    res.json(successResponse(null, "Varredura de alertas concluída"));
  });
}
