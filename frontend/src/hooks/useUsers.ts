import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/user-category.service";
import { categoryService } from "../services/user-category.service";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
    staleTime: Infinity, // usuários nunca mudam
  });
}

export function useCategories(type?: "income" | "expense") {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () =>
      type ? categoryService.getByType(type) : categoryService.getAll(),
    staleTime: Infinity, // categorias nunca mudam
  });
}
