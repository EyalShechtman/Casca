import { useState } from "react";

interface Transaction {
    date: string;
    description: string;
    amount: string;
    type: string;
  }
  
  interface TransactionsTableProps {
    transactions: Transaction[];
  }
  
  function TransactionsTable({ transactions }: TransactionsTableProps) {
    const [sortColumn, setSortColumn] = useState<keyof Transaction | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [searchQuery, setSearchQuery] = useState("");
  
    // ✅ Sorting Logic
    const handleSort = (column: keyof Transaction) => {
      if (sortColumn === column) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    
      } else {
        setSortColumn(column);
        setSortOrder("asc");
      }
    };
  
    // Convert amount string to number for comparison
    const getNumericAmount = (amount: string) => {
      return parseFloat(amount.replace(/[$,]/g, ''));
    };
  
    const sortedTransactions = [...transactions].sort((a, b) => {
      if (!sortColumn) return 0;
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
  
      if (typeof aValue === "string") {
        if (sortColumn === "amount") {
          const aNum = getNumericAmount(aValue);
          const bNum = getNumericAmount(bValue);
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        } else {
          return sortOrder === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
      } else {
        return sortOrder === "asc" 
          ? parseFloat(aValue) - parseFloat(bValue) 
          : parseFloat(bValue) - parseFloat(aValue);
      }
    });

  
    // ✅ Filtering Logic (Search)
    const filteredTransactions = sortedTransactions.filter(
      (t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.date.includes(searchQuery) ||
        t.amount.toString().includes(searchQuery) ||
        t.type.toLowerCase().includes(searchQuery)
    );
  
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* ✅ SEARCH INPUT */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
  
        {/* ✅ TRANSACTIONS TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                {["date", "description", "amount", "type"].map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column as keyof Transaction)}
                    className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition"
                  >
                    {column.charAt(0).toUpperCase() + column.slice(1)}{" "}
                    {sortColumn === column ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">{transaction.date}</td>
                  <td 
                    className="px-6 py-4 whitespace-nowrap"
                    data-description={transaction.description}
                  >
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.amount}
                  </td>
                  <td className="px-6 py-4">{transaction.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  export default TransactionsTable;
  