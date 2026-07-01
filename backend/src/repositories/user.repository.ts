import prisma from "../database/prisma";
import { User } from "../models/types";

export class UserRepository {
  // Busca todos os usuários
  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { name: "asc" },
    }) as Promise<User[]>;
  }

  // Busca usuário por ID
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    }) as Promise<User | null>;
  }

  // Busca usuário por nome
  async findByName(name: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { name },
    }) as Promise<User | null>;
  }
}
