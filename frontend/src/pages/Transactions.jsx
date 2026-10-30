import { useEffect, useState } from 'react'
import { getTransactions, amountText } from '../services/transactions'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const list = await getTransactions()
      setTransactions(list)
    }
    load()
  }, [])

  function clearFilters() {
    setTypeFilter('all')
    setMonthFilter('')
    setSearch('')
  }

  const shown = []
  let incomeTotal = 0
  let expenseTotal = 0

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i]
    let keep = true

    if (typeFilter !== 'all' && t.type !== typeFilter) {
      keep = false
    }

    if (monthFilter !== '' && !t.date.startsWith(monthFilter)) {
      keep = false
    }

    const text = (t.title + ' ' + t.note).toLowerCase()
    if (search !== '' && !text.includes(search.toLowerCase())) {
      keep = false
    }

    if (keep) {
      shown.push(t)
      if (t.type === 'income') {
        incomeTotal = incomeTotal + t.amount
      } else {
        expenseTotal = expenseTotal + t.amount
      }
    }
  }

  return (
    <div>
      <h1 className="page-title">Transactions</h1>

      <div className="cards">
        <div className="card">
          <p className="card-label">Income</p>
          <p className="card-value">{'₹' + incomeTotal.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Expenses</p>
          <p className="card-value">{'₹' + expenseTotal.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Balance</p>
          <p className="card-value">{'₹' + (incomeTotal - expenseTotal).toFixed(2)}</p>
        </div>
      </div>

      <div className="section">
        <div className="filters">
          <div>
            <label>Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>

          <div>
            <label>Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>

          <div>
            <label>Search</label>
            <input
              type="text"
              placeholder="Food, lunch, scholarship"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button className="btn-cancel" type="button" onClick={clearFilters}>
          Clear filters
        </button>
      </div>

      <div className="section list-section">
        <h3>{shown.length + ' transactions'}</h3>

        {shown.length === 0 && (
          <p className="muted">Nothing to show. Add income or expenses, or change the filters.</p>
        )}

        {shown.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Note</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.typeLabel}</td>
                    <td>{t.title}</td>
                    <td>{t.note}</td>
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

export default Transactions