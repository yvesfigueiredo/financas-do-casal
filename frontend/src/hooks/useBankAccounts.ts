import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankAccountService } from "../services/bank-account.service";
import { CreateBankAccountDTO, CreateTransferDTO } from "../types";

export function useBankAccounts(userId?: string) {
  return useQuery({
    queryKey: ["bank-accounts", userId],
    queryFn: () => bankAccountService.getAll(userId),
    staleTime: 1000 * 30,
  });
}

export function useActiveBankAccounts(userId?: string) {
  return useQuery({
    queryKey: ["bank-accounts", "active", userId],
    queryFn: () => bankAccountService.getActive(userId),
    staleTime: 1000 * 30,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBankAccountDTO) => bankAccountService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankAccountService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransferDTO) => bankAccountService.createTransfer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

export function useTransfers(accountId?: string) {
  return useQuery({
    queryKey: ["transfers", accountId],
    queryFn: () => bankAccountService.getTransfers(accountId),
    staleTime: 1000 * 30,
  });
}
