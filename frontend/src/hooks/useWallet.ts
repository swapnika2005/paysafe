import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "../api/endpoints/wallet.api";
import { QUERY_KEYS } from "../api/queryKeys";
import { authApi } from "@/api/endpoints/auth.api";
import { keepPreviousData } from "@tanstack/react-query";


export const useWallet = () => {
  return useQuery({
    queryKey: QUERY_KEYS.wallet,
    queryFn:  async () => {
      const { data } = await walletApi.getBalance();
      return data.data.wallet;
    },
    refetchInterval: 1000 * 30, // auto-refresh every 30 seconds
  });
};


export const useWalletStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.walletStats,       
    queryFn: async () => {
      const { data } = await walletApi.getStats();
      return data.data;
    },
    refetchInterval: 1000 * 60,
  });
};



export const useTopUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount) => walletApi.topUp(amount),

    onSuccess: () => {
      // Refresh balance + logs after top up
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletLogs });
    },
  });
};


export function useSendMoney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      receiver_phone: string;
      amount: number;
      note: string;
      pin: string;
    }) => walletApi.sendMoney(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletLogs });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.walletStats });
    },
  });
}

export const useTransactionHistory = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.transactions, params],
    queryFn:  async () => {
      const { data } = await walletApi.getHistory(params);
      return data.data;
    },
   placeholderData: keepPreviousData, // smooth pagination — keeps old data while fetching new
  });
};


export const useWalletLogs = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.walletLogs, params],
    queryFn:  async () => {
      const { data } = await walletApi.getLogs(params);
      return data.data;
    },
    placeholderData: keepPreviousData,
  });
};



export const useExportLogs = () => {
  return useMutation({
    mutationFn: () => walletApi.exportLogs(),
   onSuccess: (response) => {
      const blob = new Blob([response.data]);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "wallet-logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
  });
};