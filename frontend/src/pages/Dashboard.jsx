import { useEffect, useState } from 'react'
import api from '../services/api'
import ProgressBar from '../components/ProgressBar'
import { getTransactions, amountText } from '../services/transactions'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])

  const today = new Date()
  const monthNumber = today.getMonth() + 1
  const yearNumber = today.getFullYear()

  let monthText = String(monthNumber)
  if (monthNumber < 10) {
    monthText = '0' + monthNumber
  }
  const thisMonth = yearNumber + '-' + monthText

  useEffect(() => {
    async function load() {
      const me = await api.get('/auth/me/')
      setUser(me.data)

      const list = await getTransactions()
      setTransactions(list)

      const budgetResponse = await api.get(
        '/budgets/?month=' + monthNumber + '&year=' + yearNumber
      )
      setBudgets(budgetResponse.data)
    }
    load()
  }, [])

  let income = 0
  let expenses = 0
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i]
    if (t.date.startsWith(thisMonth)) {
      if (t.type === 'income') {
        income = income + t.amount
      } else {
        expenses = expenses + t.amount
      }
    }
  }

  let overall = null
  for (let i = 0; i < budgets.length; i++) {
    if (budgets[i].category_id === null) {
      overall = budgets[i]
    }
  }

  const recent = transactions.slice(0, 5)

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      {user && (
        <p className="muted welcome">
          Welcome back, <b>{user.username}</b>. Showing totals for {thisMonth}.
        </p>
      )}

      <div className="cards">
        <div className="card">
          <p className="card-label">Income this month</p>
          <p className="card-value">{'₹' + income.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Expenses this month</p>
          <p className="card-value">{'₹' + expenses.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Balance</p>
          <p className="card-value">{'₹' + (income - expenses).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Overall budget used</p>
          <p className="card-value">
            {overall === null ? 'Not set' : overall.percent_used + '%'}
          </p>
        </div>
      </div>

      <div className="section">
        <h3>Budgets this month</h3>

        {budgets.length === 0 && (
          <p className="muted">No budgets set for this month. Create one on the Budgets page.</p>
        )}

        {budgets.map((b) => (
          <div className="budget-item" key={b.id}>
            <div className="budget-top">
              <b>{b.category_name}</b>
              <span>{'₹' + b.spent.toFixed(2) + ' of ₹' + b.limit_amount.toFixed(2)}</span>
            </div>
            <ProgressBar percent={b.percent_used} status={b.status} />
          </div>
        ))}
      </div>

      <div className="section list-section">
        <h3>Recent transactions</h3>

        {recent.length === 0 && (
          <p className="muted">No transactions yet.</p>
        )}

        {recent.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.title}</td>
                    <td className={'amount-' + t.type}>{amountText(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard