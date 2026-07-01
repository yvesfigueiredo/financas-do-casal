import { Request, Response } from "express";
import { BankImportService } from "../services/bank-import.service";
import { asyncHandler, successResponse } from "../utils/errors";
import { bankImportSchema } from "../models/schemas";

export class BankImportController {
  constructor(private readonly service: BankImportService) {}

  import = asyncHandler(async (req: Request, res: Response) => {
    const data = bankImportSchema.parse(req.body);
    const userId = req.body.userId as string;
    const filename = req.body.filename as string || `import.${data.format}`;
    const result = await this.service.importFile(data.bankAccountId, data.format, data.content, filename, userId);
    res.status(201).json(successResponse(result, `${result.importedRows} transação(ões) importada(s), ${result.duplicateRows} duplicata(s) ignorada(s)`));
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const bankAccountId = req.query.bankAccountId as string | undefined;
    const imports = await this.service.getAll(bankAccountId);
    res.json(successResponse(imports));
  });
}
