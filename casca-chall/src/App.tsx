import { useState } from 'react'
import { CloudArrowUpIcon, ClipboardDocumentIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import './index.css';
import TransactionsTable from './TransactionsTbl';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale)

interface Transaction {
  date: string
  description: string
  amount: string
  type: string
}

interface BankStatement {
  account_holder_name: string
  statement_period: {
    start_date: string
    end_date: string
  }
  opening_balance: string
  closing_balance: string
  transactions: Transaction[]
  summary: string
  recurring_transactions: string[]
  top_categories: {[key:string]:number}
}

interface Statistics {
  NCF: { [key: string]: number }
  expense_income_ratio: { [key: string]: number }
  overdraft_limit: number
  income_stability: number
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bankData, setBankData] = useState<BankStatement | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setBankData(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    
    setIsAnalyzing(true)
    setError(null)
    setBankData(null)
    setStatistics(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile!)

      const uploadResponse = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadResponse.ok) {
        throw new Error('File upload failed')
      }

      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Fetch both data in parallel
      const [bankResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:5000/load_bank_statement'),
        fetch('http://localhost:5000/get_statistics')
      ])
      if (!bankResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch analysis data')
      }

      const [bankData, statsData] = await Promise.all([
        bankResponse.json(),
        statsResponse.json()
      ])
      setBankData(bankData)
      setStatistics(statsData)
    } catch (error) {
      console.error('Error analyzing file:', error)
      setError('Failed to analyze the file. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const prepareChartData = (categories: {[key: string]: number}) => {
    const colors = [
      { bg: 'rgba(79, 70, 229, 0.8)', border: 'rgb(79, 70, 229)' },
      { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgb(236, 72, 153)' },
      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' },
      { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgb(99, 102, 241)' },
    ]

    const labels = Object.keys(categories)
    const data = Object.values(categories)
    
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c.bg).slice(0, labels.length),
        borderColor: colors.map(c => c.border).slice(0, labels.length),
        borderWidth: 2,
      }],
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)

  const statsInfo = {
    NCF: "Net Cash Flow (NCF) shows the total movement of money in your account. Debits - Credits = NCF.",
    income_stability: "Income Stability shows how consistent your income is across months. 100% means perfectly stable income, 0 means no stability.",
    overdraft: "# of times your account balance went below zero during this period.",
    expense_ratio: "Average Expense Ratio shows what percentage of your income goes to expenses. Lower percentages indicate better saving habits."
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section with Account Holder */}
      <div className="bg-gradient-to-r from-indigo-500 to-pink-500 py-16 text-center text-white">
        <h1 className="text-5xl font-extrabold mb-4">Financial Insights Dashboard</h1>
        {bankData && (
          <h2 className="text-2xl font-medium mb-4">
            Welcome, {bankData.account_holder_name}
          </h2>
        )}
        <p className="text-xl text-indigo-50 max-w-2xl mx-auto">
          Get detailed analysis and visualization of your bank statement in seconds.
        </p>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto -mt-10 mb-8 px-4 flex flex-col items-center">
        {/* Card-like container to offset hero */}
        <div className="bg-white w-full rounded-xl shadow-xl p-6">
          {/* Upload Section */}
          <div className="flex flex-col md:flex-row items-center md:justify-between space-y-4 md:space-y-0">
            <div 
              className="flex flex-col items-center justify-center w-full md:w-1/2 p-4 border-2 border-dashed border-indigo-300 rounded-xl bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              {/* Icon reduced in size */}
              <CloudArrowUpIcon className="h-8 w-8 text-indigo-500 mb-2" />
              <label htmlFor="file-upload" className="cursor-pointer mt-1">
                <span className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                  {selectedFile ? `✅ ${selectedFile.name}` : 'Click or drop your PDF'}
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className={`mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-xl text-white font-medium text-base
                flex items-center justify-center transition-all
                ${
                  !selectedFile || isAnalyzing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600'
                }`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373
                         0 0 5.373 0 12h4zm2 5.291A7.962
                         7.962 0 014 12H0c0 3.042 1.135
                         5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                'Analyze Statement'
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-center mt-4">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Loading Progress Bar */}
      {isAnalyzing && (
        <div className="w-full max-w-5xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Analyzing your statement...</span>
              <span className="text-sm font-medium text-indigo-600">Please wait</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '90%' }}></div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              This usually takes about 15-20 seconds
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {(bankData || statistics) && (
        <div className="w-full max-w-5xl mx-auto px-4 pb-12 space-y-12">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Net Cash Flow',
                value: formatCurrency(
                  Object.values(statistics?.NCF || {}).reduce((a, b) => a + b, 0),
                ),
                icon: '💰',
                color: 'bg-blue-600',
                info: statsInfo.NCF
              },
              {
                label: 'Income Stability',
                value: `${statistics?.income_stability.toFixed(1)}%`,
                icon: '📈',
                color: 'bg-green-600',
                info: statsInfo.income_stability
              },
              {
                label: 'Overdrafts',
                value: statistics?.overdraft_limit,
                icon: '⚠️',
                color: 'bg-red-600',
                info: statsInfo.overdraft
              },
              {
                label: 'Avg Expense Ratio',
                value: `${(
                  Object.values(statistics?.expense_income_ratio || {}).reduce(
                    (a, b) => a + b,
                    0,
                  ) /
                  (Object.keys(statistics?.expense_income_ratio || {}).length || 1)
                ).toFixed(1)}%`,
                icon: '📊',
                color: 'bg-purple-600',
                info: statsInfo.expense_ratio
              },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4 flex items-center">
                <div
                  className={`${stat.color} text-white text-2xl h-12 w-12 flex items-center justify-center rounded-lg mr-4`}
                >
                  {stat.icon}
                </div>
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <div className="group relative ml-2">
                      <InformationCircleIcon className="h-4 w-4 text-gray-400 hover:text-indigo-500 cursor-help" />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        {stat.info}
                        {/* Arrow */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-semibold">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Recurring Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Spending Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                Spending Categories
              </h3>
              <div className="flex justify-center">
                <div className="max-w-xs">
                  <Pie
                    data={prepareChartData(bankData?.top_categories || {})}
                    options={{
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { padding: 10, usePointStyle: true },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = Number(context.raw);
                              const dataset = context.dataset;
                              const total = dataset.data.reduce((sum, val) => sum + Number(val), 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${value} transactions (${percentage}%)`;
                            }
                          }
                        }
                      },
                    }}
                  />
                </div>
              </div>
              {/* Category breakdown list */}
              {bankData?.top_categories && Object.keys(bankData.top_categories).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2 text-gray-700">
                    Categories Breakdown
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(bankData.top_categories)
                      .sort(([,a], [,b]) => b - a) // Sort by number of transactions
                      .map(([category, count], i) => (
                        <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <span className="text-gray-700">{category}</span>
                          <span className="text-gray-500 font-medium">
                            {count} {count === 1 ? 'transaction' : 'transactions'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                Recurring Transactions
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {bankData?.recurring_transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg hover:shadow transition cursor-pointer"
                    onClick={() => {
                      // Find matching transaction in table
                      const matchingRow = document.querySelector(`td[data-description="${transaction}"]`);
                      if (matchingRow) {
                        matchingRow.scrollIntoView({ behavior: 'smooth' });
                        matchingRow.classList.add('bg-indigo-100');
                        setTimeout(() => matchingRow.classList.remove('bg-indigo-100'), 2000);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3">🔄</span>
                      <span className="text-gray-700 font-medium">{transaction}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        navigator.clipboard.writeText(transaction);
                        const button = e.currentTarget;
                        button.classList.add('text-green-500');
                        setTimeout(() => button.classList.remove('text-green-500'), 1000);
                      }}
                      className="p-2 hover:bg-indigo-100 rounded-full transition-colors"
                      title="Copy to clipboard"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          {bankData?.transactions && bankData.transactions.length > 0 && (
            <TransactionsTable transactions={bankData.transactions} />
          )}
        </div>
      )}
    </div>
  )
}

export default App
