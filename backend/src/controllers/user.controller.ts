import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { asyncHandler, successResponse } from "../utils/errors";

export class UserController {
  constructor(private readonly userService: UserService) {}

  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAll();
    res.json(successResponse(users));
  });
}
