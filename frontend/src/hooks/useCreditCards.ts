import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creditCardService } from "../services/credit-card.service";
import { CreateCreditCardDTO, UpdateCreditCardDTO } from "../types";

export function useCreditCards(userId?: string) {
  return useQuery({
    queryKey: ["credit-cards", userId],
    queryFn: () => creditCardService.getAll(userId),
    staleTime: 1000 * 30,
  });
}

export function useActiveCreditCards(userId?: string) {
  return useQuery({
    queryKey: ["credit-cards", "active", userId],
    queryFn: () => creditCardService.getActive(userId),
    staleTime: 1000 * 30,
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCreditCardDTO) => creditCardService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCreditCardDTO }) =>
      creditCardService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useToggleCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditCardService.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditCardService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}
