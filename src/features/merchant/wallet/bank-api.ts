import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { asList } from "@/lib/api/paginate";

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban?: string | null;
  branchName?: string | null;
  isDefault?: boolean;
}

/** CreateBankAccountDto: bankName 2–100, accountHolderName 2–150, accountNumber 5–50 (letters, digits, dashes), iban 15–34, branchName 2–150. */
export type BankInput = { bankName: string; accountHolderName: string; accountNumber: string; iban?: string; branchName?: string };

export const fetchBankAccounts = async () => asList<BankAccount>(await apiGet<unknown>("/bank-accounts"));
export const createBankAccount = (b: BankInput) => apiPost("/bank-accounts", b);
export const updateBankAccount = (id: string, b: Partial<BankInput>) => apiPatch(`/bank-accounts/${id}`, b);
export const setDefaultBankAccount = (id: string) => apiPatch(`/bank-accounts/${id}/default`);
export const deleteBankAccount = (id: string) => apiDelete(`/bank-accounts/${id}`);
