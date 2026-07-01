import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";
import { SimulationService } from "../services/simulation.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { dashboardFiltersSchema, annualFiltersSchema, simulationSchema } from "../models/schemas";
import { getCurrentMonthYear } from "../utils/helpers";

export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly simulationService: SimulationService
  ) {}

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const filters = dashboardFiltersSchema.parse(req.query);
    const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
    const summary = await this.dashboardService.getSummary(
      filters.month ?? currentMonth,
      filters.year ?? currentYear,
      filters.userId
    );
    res.json(successResponse(summary));
  });

  getAnnual = asyncHandler(async (req: Request, res: Response) => {
    const filters = annualFiltersSchema.parse(req.query);
    const annual = await this.dashboardService.getAnnualSummary(filters.year, filters.userId);
    res.json(successResponse(annual));
  });

  getCashFlow = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const cashFlow = await this.dashboardService.getCashFlow(userId);
    res.json(successResponse(cashFlow));
  });

  simulate = asyncHandler(async (req: Request, res: Response) => {
    const input = simulationSchema.parse(req.body);
    const result = await this.simulationService.simulate(input as import("../models/types").SimulationInput);
    res.json(successResponse(result));
  });
}
