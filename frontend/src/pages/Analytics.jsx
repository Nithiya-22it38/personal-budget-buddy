import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import ProgressBar from '../components/ProgressBar'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const sliceColors = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899',
]

function Analytics() {
  const today = new Date()
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]

  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())

  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [goals, setGoals] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const query = '?month=' + month + '&year=' + year

        const summaryResponse = await api.get('/analytics/summary/' + query)
        setSummary(summaryResponse.data)

        const categoryResponse = await api.get('/analytics/categories/' + query)
        setCategories(categoryResponse.data.categories)

        const goalResponse = await api.get('/goals/')
        setGoals(goalResponse.data)

        setError('')
      } catch (err) {
        setError('Could not load the analytics. Is the backend running?')
      }
    }
    loadData()
  }, [month, year])

  return (
    <div>
      <h1 className="page-title">Analytics</h1>

      <div className="month-row">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {monthNames.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      {summary && (
        <div className="cards">
          <div className="card">
            <p className="card-label">Income</p>
            <p className="card-value">{'₹' + summary.income_total.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="card-label">Expenses</p>
            <p className="card-value">{'₹' + summary.expense_total.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="card-label">Balance</p>
            <p className="card-value">{'₹' + summary.balance.toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="card-label">Saved toward goals</p>
            <p className="card-value">{'₹' + summary.saved_total.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="section">
        <h3>Spending by category</h3>

        {categories.length === 0 && (
          <p className="muted">No expenses in this month.</p>
        )}

        {categories.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categories} dataKey="amount" nameKey="name" outerRadius={100}>
                {categories.map((c, index) => (
                  <Cell key={c.name} fill={sliceColors[index % sliceColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => '₹' + Number(value).toFixed(2)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {categories.map((c) => (
          <div className="budget-item" key={c.name}>
            <div className="budget-top">
              <b>{c.name}</b>
              <span>{'₹' + c.amount.toFixed(2) + ' (' + c.percent + '%)'}</span>
            </div>
            <ProgressBar percent={c.percent} status="ok" />
          </div>
        ))}
      </div>

      <div className="section list-section">
        <h3>Income by source</h3>

        {(!summary || summary.income_by_source.length === 0) && (
          <p className="muted">No income in this month.</p>
        )}

        {summary && summary.income_by_source.map((s) => (
          <div className="budget-item" key={s.name}>
            <div className="budget-top">
              <b>{s.name}</b>
              <span>{'₹' + s.amount.toFixed(2) + ' (' + s.percent + '%)'}</span>
            </div>
            <ProgressBar percent={s.percent} status="done" />
          </div>
        ))}
      </div>

      <div className="section list-section">
        <h3>Savings progress</h3>

        {goals.length === 0 && (
          <p className="muted">No savings goals yet. Create one on the Savings Goals page.</p>
        )}

        {goals.map((g) => (
          <div className="budget-item" key={g.id}>
            <div className="budget-top">
              <b>{g.name}</b>
              <span>{'₹' + g.saved_amount.toFixed(2) + ' of ₹' + g.target_amount.toFixed(2)}</span>
            </div>
            <ProgressBar
              percent={g.percent_saved}
              status={g.status === 'completed' ? 'done' : 'ok'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Analytics