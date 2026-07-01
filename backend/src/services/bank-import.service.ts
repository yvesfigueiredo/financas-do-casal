import { BankImportRepository } from "../repositories/bank-import.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { BankAccountRepository } from "../repositories/bank-account.repository";
import { BankImport, ParsedImportRow } from "../models/types";
import { NotFoundError, ValidationError } from "../utils/errors";

// Palavras-chave para categorização automática heurística
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Alimentação": ["mercado", "supermercado", "restaurante", "ifood", "padaria", "lanchonete"],
  "Transporte": ["uber", "99", "combustivel", "combustível", "posto", "estacionamento"],
  "Saúde": ["farmacia", "farmácia", "drogaria", "clinica", "clínica", "hospital"],
  "Lazer": ["cinema", "netflix", "spotify", "show", "ingresso"],
  "Moradia": ["aluguel", "condominio", "condomínio", "imobiliaria"],
  "Boleto": ["boleto", "conta de luz", "energia", "agua", "água"],
};

export class BankImportService {
  constructor(
    private readonly importRepo: BankImportRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly categoryRepo: CategoryRepository,
    private readonly accountRepo: BankAccountRepository
  ) {}

  async importFile(
    bankAccountId: string,
    format: "ofx" | "csv",
    content: string,
    filename: string,
    userId: string
  ): Promise<BankImport> {
    const account = await this.accountRepo.findById(bankAccountId);
    if (!account) throw new NotFoundError("Conta bancária");

    const rows = format === "ofx" ? this.parseOFX(content) : this.parseCSV(content);
    if (rows.length === 0) {
      throw new ValidationError("Nenhuma transação válida encontrada no arquivo");
    }

    const importRecord = await this.importRepo.create({
      filename,
      format,
      bankAccountId,
      totalRows: rows.length,
    });

    let imported = 0;
    let duplicates = 0;

    const categories = await this.categoryRepo.findAll();

    for (const row of rows) {
      const isDuplicate = await this.importRepo.findPossibleDuplicate(
        bankAccountId,
        row.date,
        row.amount,
        row.description
      );

      if (isDuplicate) {
        duplicates++;
        continue;
      }

      const categoryId = this.detectCategory(row.description, categories, row.type);

      await this.transactionRepo.create({
        description: row.description,
        amount: Math.abs(row.amount),
        type: row.type,
        date: row.date.toISOString(),
        paymentMethod: "debit",
        userId,
        categoryId,
        bankAccountId,
      });

      imported++;
    }

    return this.importRepo.update(importRecord.id, {
      status: "processed",
      importedRows: imported,
      duplicateRows: duplicates,
    });
  }

  async getAll(bankAccountId?: string): Promise<BankImport[]> {
    return this.importRepo.findAll(bankAccountId);
  }

  // Parser CSV — espera colunas: data,descricao,valor (vírgula ou ponto-vírgula)
  private parseCSV(content: string): ParsedImportRow[] {
    const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const rows: ParsedImportRow[] = [];

    // Detecta separador
    const separator = lines[0]?.includes(";") ? ";" : ",";

    // Pula cabeçalho se a primeira linha não parecer uma data válida
    const startIndex = this.looksLikeHeader(lines[0]) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(separator).map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length < 3) continue;

      const [dateStr, description, amountStr] = parts;
      const date = this.parseDate(dateStr);
      if (!date) continue;

      const amount = this.parseAmount(amountStr);
      if (amount === null) continue;

      rows.push({
        date,
        description: description || "Importado",
        amount: Math.abs(amount),
        type: amount >= 0 ? "income" : "expense",
      });
    }

    return rows;
  }

  // Parser OFX simplificado — extrai blocos STMTTRN
  private parseOFX(content: string): ParsedImportRow[] {
    const rows: ParsedImportRow[] = [];
    const transactionBlocks = content.split("<STMTTRN>").slice(1);

    for (const block of transactionBlocks) {
      const endIndex = block.indexOf("</STMTTRN>");
      const txContent = endIndex >= 0 ? block.substring(0, endIndex) : block;

      const amountMatch = txContent.match(/<TRNAMT>([^\r\n<]+)/);
      const dateMatch = txContent.match(/<DTPOSTED>([^\r\n<]+)/);
      const memoMatch = txContent.match(/<MEMO>([^\r\n<]+)/);
      const nameMatch = txContent.match(/<NAME>([^\r\n<]+)/);
      const idMatch = txContent.match(/<FITID>([^\r\n<]+)/);

      if (!amountMatch || !dateMatch) continue;

      const amount = parseFloat(amountMatch[1]);
      if (isNaN(amount)) continue;

      const dateRaw = dateMatch[1].substring(0, 8); // YYYYMMDD
      const date = new Date(
        parseInt(dateRaw.substring(0, 4), 10),
        parseInt(dateRaw.substring(4, 6), 10) - 1,
        parseInt(dateRaw.substring(6, 8), 10)
      );

      const description = (memoMatch?.[1] || nameMatch?.[1] || "Importado OFX").trim();

      rows.push({
        date,
        description,
        amount: Math.abs(amount),
        type: amount >= 0 ? "income" : "expense",
        originalId: idMatch?.[1],
      });
    }

    return rows;
  }

  private looksLikeHeader(line: string): boolean {
    return !/^\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}/.test(line);
  }

  private parseDate(value: string): Date | null {
    // Tenta DD/MM/YYYY
    let match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));

    // Tenta YYYY-MM-DD
    match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseAmount(value: string): number | null {
    const cleaned = value.replace(/[R$\s]/g, "").replace(/\.(?=\d{3},)/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  // Categorização automática por palavras-chave na descrição
  private detectCategory(
    description: string,
    categories: { id: string; name: string; type: string }[],
    type: "income" | "expense"
  ): string {
    const lowerDesc = description.toLowerCase();

    for (const [categoryName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => lowerDesc.includes(kw))) {
        const found = categories.find((c) => c.name === categoryName);
        if (found) return found.id;
      }
    }

    // Fallback: primeira categoria "Outros" do tipo correspondente
    const fallback = categories.find((c) => c.name.startsWith("Outros") && c.type === type);
    return fallback?.id ?? categories.find((c) => c.type === type)?.id ?? categories[0].id;
  }
}
