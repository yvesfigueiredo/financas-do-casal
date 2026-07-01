import { UserRepository } from "../repositories/user.repository";
import { User } from "../models/types";
import { NotFoundError } from "../utils/errors";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // Retorna todos os usuários do sistema
  async getAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  // Retorna um usuário por ID, lançando erro se não encontrado
  async getById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuário");
    }
    return user;
  }

  // Valida que um userId existe antes de criar lançamentos
  async validateExists(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuário");
    }
  }
}
