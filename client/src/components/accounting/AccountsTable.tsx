import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Account } from "@shared/schema";

type AccountsTableProps = {
  classCode: string;
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
};

export default function AccountsTable({ classCode, onAddAccount, onEditAccount }: AccountsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: [`/api/accounts/${classCode}`],
  });

  const filteredAccounts = accounts?.filter(account => 
    account.code.includes(searchTerm) || 
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((filteredAccounts?.length || 0) / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAccounts = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'A': return { label: 'Activ', class: 'bg-success-light/20 text-success-main' };
      case 'P': return { label: 'Pasiv', class: 'bg-info-light/20 text-info-main' };
      case 'B': return { label: 'Bifuncțional', class: 'bg-warning-light/20 text-warning-main' };
      default: return { label: 'Necunoscut', class: 'bg-gray-200 text-gray-600' };
    }
  };

  const goToPage = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Group accounts by first two digits of code
  const groupedAccounts: Record<string, Account[]> = {};
  currentAccounts.forEach(account => {
    const groupCode = account.code.substring(0, 2);
    if (!groupedAccounts[groupCode]) {
      groupedAccounts[groupCode] = [];
    }
    groupedAccounts[groupCode].push(account);
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Plan de Conturi 2025 (Sistem Românesc)</h3>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Caută cont..." 
              className="pl-9 pr-4 py-2 border rounded-md outline-none focus:border-primary w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="material-icons absolute left-3 top-2.5 text-gray-500">search</span>
          </div>
          
          <button 
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark"
            onClick={onAddAccount}
          >
            <span className="material-icons mr-2 text-sm">add</span>
            <span>Cont Nou</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cod</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Denumire</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Tip</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sold Inițial</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Debit</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Credit</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sold Final</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center">
                  <span className="material-icons animate-spin text-primary">sync</span>
                </td>
              </tr>
            ) : (
              Object.entries(groupedAccounts).map(([groupCode, groupAccounts]) => (
                <React.Fragment key={groupCode}>
                  <tr className="bg-gray-50">
                    <td colSpan={8} className="py-2 px-4 text-sm font-semibold text-primary-dark">
                      {groupCode}. {/* Group name would be fetched from the database */}
                    </td>
                  </tr>
                  
                  {groupAccounts.map((account) => {
                    const typeInfo = getAccountTypeLabel(account.type);
                    return (
                      <tr key={account.id} className="account-row border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{account.code}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{account.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 text-center">
                          <span className={`${typeInfo.class} text-xs px-2 py-0.5 rounded`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 text-right">0.00</td>
                        <td className="py-3 px-4 text-sm text-gray-700 text-right">0.00</td>
                        <td className="py-3 px-4 text-sm text-gray-700 text-right">0.00</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">0.00</td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            className="text-gray-500 hover:text-primary"
                            onClick={() => onEditAccount(account)}
                          >
                            <span className="material-icons text-sm">edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
            
            {!isLoading && Object.keys(groupedAccounts).length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Nu există conturi pentru această clasă sau care să corespundă căutării.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500">
            Afișare {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAccounts.length)} din {filteredAccounts.length} conturi
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="w-8 h-8 flex items-center justify-center rounded border text-gray-500 disabled:opacity-50"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                className={`w-8 h-8 flex items-center justify-center rounded border ${
                  page === currentPage 
                    ? 'bg-primary text-white' 
                    : 'text-gray-500'
                }`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              className="w-8 h-8 flex items-center justify-center rounded border text-gray-500 disabled:opacity-50"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
