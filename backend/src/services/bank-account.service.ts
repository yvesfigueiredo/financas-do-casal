import { BankAccountRepository } from "../repositories/bank-account.repository";
import { UserRepository } from "../repositories/user.repository";
import {
  BankAccount,
  BankAccountWithStats,
  CreateBankAccountDTO,
  UpdateBankAccountDTO,
  Transfer,
  CreateTransferDTO,
} from "../models/types";
import { AppError, NotFoundError, ValidationError } from "../utils/errors";
import { roundMoney } from "../utils/helpers";

export class BankAccountService {
  constructor(
    private readonly accountRepo: BankAccountRepository,
    private readonly userRepo: UserRepository
  ) {}

  async getAll(userId?: string): Promise<BankAccountWithStats[]> {
    const accounts = await this.accountRepo.findAll(userId);
    return Promise.all(accounts.map((a) => this.buildStats(a)));
  }

  async getActive(userId?: string): Promise<BankAccountWithStats[]> {
    const accounts = await this.accountRepo.findActive(userId);
    return Promise.all(accounts.map((a) => this.buildStats(a)));
  }

  async getById(id: string): Promise<BankAccountWithStats> {
    const account = await this.accountRepo.findById(id);
    if (!account) throw new NotFoundError("Conta bancária");
    return this.buildStats(account);
  }

  async create(data: CreateBankAccountDTO): Promise<BankAccount> {
    const user = await this.userRepo.findById(data.userId);
    if (!user) throw new NotFoundError("Usuário");
    return this.accountRepo.create(data);
  }

  async update(id: string, data: UpdateBankAccountDTO): Promise<BankAccount> {
    const account = await this.accountRepo.findById(id);
    if (!account) throw new NotFoundError("Conta bancária");
    return this.accountRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const account = await this.accountRepo.findById(id);
    if (!account) throw new NotFoundError("Conta bancária");
    await this.accountRepo.delete(id);
  }

  async createTransfer(data: CreateTransferDTO): Promise<Transfer> {
    if (data.fromAccountId === data.toAccountId) {
      throw new ValidationError("Conta de origem e destino não podem ser iguais");
    }
    const [from, to] = await Promise.all([
      this.accountRepo.findById(data.fromAccountId),
      this.accountRepo.findById(data.toAccountId),
    ]);
    if (!from) throw new NotFoundError("Conta de origem");
    if (!to) throw new NotFoundError("Conta de destino");
    if (from.currentBalance < data.amount) {
      throw new AppError("Saldo insuficiente na conta de origem", 422);
    }

    const transfer = await this.accountRepo.createTransfer(data);
    // Atualiza saldos das contas
    await Promise.all([
      this.accountRepo.updateBalance(data.fromAccountId, -data.amount),
      this.accountRepo.updateBalance(data.toAccountId, data.amount),
    ]);
    return transfer;
  }

  async getTransfers(accountId?: string): Promise<Transfer[]> {
    return this.accountRepo.findTransfers(accountId);
  }

  private async buildStats(account: BankAccount): Promise<BankAccountWithStats> {
    const [totalIn, totalOut] = await Promise.all([
      this.accountRepo.getTotalIn(account.id),
      this.accountRepo.getTotalOut(account.id),
    ]);
    const transfers = await this.accountRepo.findTransfers(account.id);
    const transferIn = transfers
      .filter((t) => t.toAccountId === account.id)
      .reduce((s, t) => s + t.amount, 0);
    const transferOut = transfers
      .filter((t) => t.fromAccountId === account.id)
      .reduce((s, t) => s + t.amount, 0);

    return {
      ...account,
      totalIn: roundMoney(totalIn),
      totalOut: roundMoney(totalOut),
      totalTransferIn: roundMoney(transferIn),
      totalTransferOut: roundMoney(transferOut),
    };
  }
}
