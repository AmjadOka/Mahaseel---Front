import { isObj } from "@/lib/api/base";
import { apiGet, apiPost } from "@/lib/api/client";
import { asList, normalizePage } from "@/lib/api/paginate";

export interface Wallet {
  availableBalance?: number | string;
  pendingBalance?: number | string;
  totalEarned?: number | string;
}
export interface WalletTx {
  id: string;
  type: string;
  reason: string;
  amount: number | string;
  balanceAfter?: number | string;
  createdAt?: string;
}
export interface Withdrawal {
  id: string;
  amount: number | string;
  status: string;
  rejectionReason?: string | null;
  createdAt?: string;
  processedAt?: string | null;
}

export const TX_PAGE_SIZE = 10;

export const fetchWallet = async (): Promise<Wallet> => {
  const r = await apiGet<unknown>("/wallet");
  return (isObj(r) && isObj(r.data) ? r.data : r) as Wallet;
};
export const fetchTransactions = async (page: number) => normalizePage<WalletTx>(await apiGet<unknown>("/wallet/transactions", { page, limit: TX_PAGE_SIZE }), page, TX_PAGE_SIZE);
export const fetchWithdrawals = async () => asList<Withdrawal>(await apiGet<unknown>("/wallet/withdrawals"));

/** WithdrawDto: amount ≥ 1, bankAccountId (uuid), notes optional. */
export const requestWithdrawal = (b: { amount: number; bankAccountId: string; notes?: string }) => apiPost("/wallet/withdraw", { ...b, notes: b.notes?.trim() || undefined });
