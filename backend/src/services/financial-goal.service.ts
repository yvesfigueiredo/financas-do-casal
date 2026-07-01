import { FinancialGoalRepository } from "../repositories/financial-goal.repository";
import { UserRepository } from "../repositories/user.repository";
import {
  FinancialGoal,
  FinancialGoalWithProgress,
  CreateFinancialGoalDTO,
  UpdateFinancialGoalDTO,
} from "../models/types";
import { NotFoundError } from "../utils/errors";
import { roundMoney } from "../utils/helpers";

export class FinancialGoalService {
  constructor(
    private readonly goalRepo: FinancialGoalRepository,
    private readonly userRepo: UserRepository
  ) {}

  async getAll(userId?: string): Promise<FinancialGoalWithProgress[]> {
    const goals = await this.goalRepo.findAll(userId);
    return goals.map((g) => this.buildProgress(g));
  }

  async getById(id: string): Promise<FinancialGoalWithProgress> {
    const goal = await this.goalRepo.findById(id);
    if (!goal) throw new NotFoundError("Objetivo financeiro");
    return this.buildProgress(goal);
  }

  async create(data: CreateFinancialGoalDTO): Promise<FinancialGoal> {
    const user = await this.userRepo.findById(data.userId);
    if (!user) throw new NotFoundError("Usuário");
    return this.goalRepo.create(data);
  }

  async update(id: string, data: UpdateFinancialGoalDTO): Promise<FinancialGoal> {
    const goal = await this.goalRepo.findById(id);
    if (!goal) throw new NotFoundError("Objetivo financeiro");
    return this.goalRepo.update(id, data);
  }

  async addContribution(id: string, amount: number): Promise<FinancialGoal> {
    const goal = await this.goalRepo.findById(id);
    if (!goal) throw new NotFoundError("Objetivo financeiro");
    return this.goalRepo.addContribution(id, amount);
  }

  async delete(id: string): Promise<void> {
    const goal = await this.goalRepo.findById(id);
    if (!goal) throw new NotFoundError("Objetivo financeiro");
    await this.goalRepo.delete(id);
  }

  private buildProgress(goal: FinancialGoal): FinancialGoalWithProgress {
    const progressPercent = goal.targetAmount > 0
      ? roundMoney(Math.min(100, (goal.currentAmount / goal.targetAmount) * 100))
      : 0;
    const remainingAmount = roundMoney(Math.max(0, goal.targetAmount - goal.currentAmount));

    let projectedCompletionDate: Date | null = null;
    let monthsToComplete: number | null = null;
    let isOnTrack = true;

    // Estima conclusão baseada na velocidade de contribuição (heurística simples:
    // assume contribuição mensal constante baseada no histórico desde a criação)
    const monthsSinceCreation = Math.max(
      1,
      (Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const avgMonthlyContribution = goal.currentAmount / monthsSinceCreation;

    if (avgMonthlyContribution > 0 && remainingAmount > 0) {
      monthsToComplete = Math.ceil(remainingAmount / avgMonthlyContribution);
      const completion = new Date();
      completion.setMonth(completion.getMonth() + monthsToComplete);
      projectedCompletionDate = completion;

      if (goal.deadline) {
        isOnTrack = completion <= new Date(goal.deadline);
      }
    } else if (remainingAmount === 0) {
      monthsToComplete = 0;
      projectedCompletionDate = new Date();
    }

    return {
      ...goal,
      progressPercent,
      remainingAmount,
      projectedCompletionDate,
      monthsToComplete,
      isOnTrack,
    };
  }
}
