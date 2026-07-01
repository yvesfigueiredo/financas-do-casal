import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { CategoryType } from "../models/types";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const type = req.query.type as CategoryType | undefined;

    const categories = type
      ? await this.categoryService.getByType(type)
      : await this.categoryService.getAll();

    res.json(successResponse(categories));
  });
}
