import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recurringExpenseService } from "../services/recurring-expense.service";
import { CreateRecurringExpenseDTO, UpdateRecurringExpenseDTO } from "../types";

export function useRecurringExpenses(userId?: string) {
  return useQuery({
    queryKey: ["recurring-expenses", userId],
    queryFn: () => recurringExpenseService.getAll(userId),
    staleTime: 1000 * 30,
  });
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringExpenseDTO) => recurringExpenseService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-expenses"] }),
  });
}

export function useUpdateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseDTO }) =>
      recurringExpenseService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-expenses"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringExpenseService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-expenses"] }),
  });
}

export function useGenerateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month?: number; year?: number }) =>
      recurringExpenseService.generateForMonth(month, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
  });
}
