import React from "react";
import { useQuery } from "@tanstack/react-query";

type Transaction = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  date: string;
  amount: string;
};

export default function RecentTransactions() {
  const { data: transactionsResponse, isLoading, isError } = useQuery<{ success: boolean; data: Transaction[] }>({
    queryKey: ['/api/ecommerce/transactions', { limit: 10, offset: 0 }],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if endpoint fails
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
  
  const transactions = transactionsResponse?.data;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Tranzacții Recente</h3>
        <button className="text-primary text-sm">Vezi toate</button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="material-icons animate-spin text-primary">sync</span>
          </div>
        ) : transactions && transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center p-3 rounded-md hover:bg-gray-50">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 
                  ${transaction.type === 'income' 
                    ? 'bg-success-light/20' 
                    : 'bg-error-light/20'}`}
              >
                <span 
                  className={`material-icons text-sm 
                    ${transaction.type === 'income' 
                      ? 'text-success-main' 
                      : 'text-error-main'}`}
                >
                  {transaction.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                <div className="text-xs text-gray-500">{transaction.date}</div>
              </div>
              <div 
                className={transaction.type === 'income' 
                  ? 'text-success-main font-medium' 
                  : 'text-error-main font-medium'}
              >
                {transaction.type === 'income' ? '+' : '-'}{transaction.amount}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nu există tranzacții recente
          </div>
        )}
      </div>
    </div>
  );
}
