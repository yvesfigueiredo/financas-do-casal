import { CategoryRepository } from "../repositories/category.repository";
import { Category, CategoryType } from "../models/types";
import { NotFoundError } from "../utils/errors";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  // Retorna todas as categorias
  async getAll(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }

  // Retorna categorias filtradas por tipo
  async getByType(type: CategoryType): Promise<Category[]> {
    return this.categoryRepository.findByType(type);
  }

  // Valida que uma categoria existe
  async validateExists(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("Categoria");
    }
    return category;
  }
}
