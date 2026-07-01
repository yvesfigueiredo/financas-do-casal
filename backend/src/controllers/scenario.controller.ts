import { Request, Response } from "express";
import { ScenarioService } from "../services/scenario.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { saveScenarioSchema } from "../models/schemas";

export class ScenarioController {
  constructor(private readonly service: ScenarioService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const scenarios = await this.service.getAll(userId);
    res.json(successResponse(scenarios));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const scenario = await this.service.getById(req.params.id);
    res.json(successResponse(scenario));
  });

  save = asyncHandler(async (req: Request, res: Response) => {
    const data = saveScenarioSchema.parse(req.body);
    const scenario = await this.service.save(data as import("../models/types").SaveScenarioDTO);
    res.status(201).json(successResponse(scenario, "Cenário salvo com sucesso"));
  });

  compare = asyncHandler(async (req: Request, res: Response) => {
    const ids = (req.query.ids as string)?.split(",") ?? [];
    const comparison = await this.service.compare(ids);
    res.json(successResponse(comparison));
  });

  rerun = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.rerun(req.params.id);
    res.json(successResponse(result));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(successResponse(null, "Cenário excluído"));
  });
}
