import prisma from "../database/prisma";
import { Category, CategoryType } from "../models/types";

export class CategoryRepository {
  // Busca todas as categorias
  async findAll(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    }) as Promise<Category[]>;
  }

  // Busca categorias por tipo
  async findByType(type: CategoryType): Promise<Category[]> {
    return prisma.category.findMany({
      where: { type },
      orderBy: { name: "asc" },
    }) as Promise<Category[]>;
  }

  // Busca categoria por ID
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    }) as Promise<Category | null>;
  }
}
