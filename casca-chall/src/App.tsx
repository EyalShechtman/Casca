import { useState } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import './index.css';

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
  top_categories: string[]
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

  const prepareChartData = (categories: string[]) => {
    const colors = [
      { bg: 'rgba(79, 70, 229, 0.8)', border: 'rgb(79, 70, 229)' },
      { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgb(236, 72, 153)' },
      { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' },
      { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgb(99, 102, 241)' },
    ]
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map(() => Math.floor(100 / (categories.length || 1))),
          backgroundColor: colors.map((c) => c.bg),
          borderColor: colors.map((c) => c.border),
          borderWidth: 2,
        },
      ],
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-pink-500 py-16 text-center text-white">
        <h1 className="text-5xl font-extrabold mb-4">Financial Insights Dashboard</h1>
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
              },
              {
                label: 'Income Stability',
                value: `${statistics?.income_stability.toFixed(1)}%`,
                icon: '📈',
                color: 'bg-green-600',
              },
              {
                label: 'Overdrafts',
                value: statistics?.overdraft_limit,
                icon: '⚠️',
                color: 'bg-red-600',
              },
              {
                label: 'Avg Expense Ratio',
                value: `${
                  (
                    Object.values(statistics?.expense_income_ratio || {}).reduce(
                      (a, b) => a + b,
                      0,
                    ) /
                    (Object.keys(statistics?.expense_income_ratio || {}).length || 1)
                  ).toFixed(1)
                }%`,
                icon: '📊',
                color: 'bg-purple-600',
              },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-4 flex items-center">
                <div
                  className={`${stat.color} text-white text-2xl h-12 w-12 flex items-center justify-center rounded-lg mr-4`}
                >
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">{stat.label}</span>
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
                    data={prepareChartData(bankData?.top_categories || [])}
                    options={{
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { padding: 10, usePointStyle: true },
                        },
                      },
                    }}
                  />
                </div>
              </div>
              {/* Example of presenting category info below the chart */}
              {bankData?.top_categories && bankData.top_categories.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2 text-gray-700">
                    Top Categories Overview
                  </h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {bankData.top_categories.map((category, i) => (
                      <li key={i} className="ml-3">
                        {category}
                      </li>
                    ))}
                  </ul>
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
                    className="flex items-center p-4 bg-indigo-50 rounded-lg hover:shadow transition"
                  >
                    <span className="text-xl mr-3">🔄</span>
                    <span className="text-gray-700 font-medium">{transaction}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 text-center">
                Recent Transactions
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bankData?.transactions.slice(0, 5).map((transaction, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">{transaction.date}</td>
                      <td className="px-6 py-4">{transaction.description}</td>
                      <td className="px-6 py-4">{transaction.amount}</td>
                      <td className="px-6 py-4">{transaction.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
