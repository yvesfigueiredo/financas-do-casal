import { Request, Response } from "express";
import { RecurringExpenseService } from "../services/recurring-expense.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { createRecurringExpenseSchema, updateRecurringExpenseSchema } from "../models/schemas";
import { getCurrentMonthYear } from "../utils/helpers";

export class RecurringExpenseController {
  constructor(private readonly service: RecurringExpenseService) {}

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const expenses = await this.service.getAll(userId);
    res.json(successResponse(expenses));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const expense = await this.service.getById(req.params.id);
    res.json(successResponse(expense));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = createRecurringExpenseSchema.parse(req.body);
    const expense = await this.service.create(data);
    res.status(201).json(successResponse(expense, "Conta fixa criada com sucesso"));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const data = updateRecurringExpenseSchema.parse(req.body);
    const expense = await this.service.update(req.params.id, data);
    res.json(successResponse(expense, "Conta fixa atualizada"));
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(successResponse(null, "Conta fixa excluída"));
  });

  generateForMonth = asyncHandler(async (req: Request, res: Response) => {
    const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
    const month = req.body.month ?? currentMonth;
    const year = req.body.year ?? currentYear;
    const result = await this.service.generateForMonth(Number(month), Number(year));
    res.json(successResponse(result, `${result.generated} lançamento(s) gerado(s)`));
  });
}
