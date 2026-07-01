import prisma from "../database/prisma";
import { SimulationScenario, SaveScenarioDTO } from "../models/types";

const include = { user: true } as const;

export class ScenarioRepository {
  async create(data: SaveScenarioDTO): Promise<SimulationScenario> {
    return prisma.simulationScenario.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        inputJson: JSON.stringify(data.input),
        resultJson: JSON.stringify(data.result),
        userId: data.userId,
      },
      include,
    }) as Promise<SimulationScenario>;
  }

  async findAll(userId?: string): Promise<SimulationScenario[]> {
    return prisma.simulationScenario.findMany({
      where: userId ? { userId } : undefined,
      include,
      orderBy: { createdAt: "desc" },
    }) as Promise<SimulationScenario[]>;
  }

  async findById(id: string): Promise<SimulationScenario | null> {
    return prisma.simulationScenario.findUnique({ where: { id }, include }) as Promise<SimulationScenario | null>;
  }

  async delete(id: string): Promise<void> {
    await prisma.simulationScenario.delete({ where: { id } });
  }
}
