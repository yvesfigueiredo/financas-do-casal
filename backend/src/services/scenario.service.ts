import { ScenarioRepository } from "../repositories/scenario.repository";
import { SimulationService } from "./simulation.service";
import { SimulationScenario, SaveScenarioDTO, SimulationInput, SimulationResult } from "../models/types";
import { NotFoundError } from "../utils/errors";

export class ScenarioService {
  constructor(
    private readonly scenarioRepo: ScenarioRepository,
    private readonly simulationService: SimulationService
  ) {}

  async save(data: SaveScenarioDTO): Promise<SimulationScenario> {
    return this.scenarioRepo.create(data);
  }

  async getAll(userId?: string): Promise<SimulationScenario[]> {
    const scenarios = await this.scenarioRepo.findAll(userId);
    return scenarios.map((s) => this.parseScenario(s));
  }

  async getById(id: string): Promise<SimulationScenario> {
    const scenario = await this.scenarioRepo.findById(id);
    if (!scenario) throw new NotFoundError("Cenário");
    return this.parseScenario(scenario);
  }

  async delete(id: string): Promise<void> {
    const scenario = await this.scenarioRepo.findById(id);
    if (!scenario) throw new NotFoundError("Cenário");
    await this.scenarioRepo.delete(id);
  }

  // Compara múltiplos cenários lado a lado
  async compare(ids: string[]): Promise<{ scenario: SimulationScenario; result: SimulationResult }[]> {
    const results = [];
    for (const id of ids) {
      const scenario = await this.getById(id);
      if (scenario.result) {
        results.push({ scenario, result: scenario.result });
      }
    }
    return results;
  }

  // Re-executa a simulação de um cenário com os parâmetros originais
  async rerun(id: string): Promise<SimulationResult> {
    const scenario = await this.getById(id);
    if (!scenario.input) throw new NotFoundError("Dados de simulação do cenário");
    return this.simulationService.simulate(scenario.input);
  }

  private parseScenario(scenario: SimulationScenario): SimulationScenario {
    try {
      return {
        ...scenario,
        input: JSON.parse(scenario.inputJson) as SimulationInput,
        result: JSON.parse(scenario.resultJson) as SimulationResult,
      };
    } catch {
      return scenario;
    }
  }
}
