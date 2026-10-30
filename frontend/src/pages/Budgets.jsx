import { useEffect, useState } from 'react'
import api from '../services/api'
import ProgressBar from '../components/ProgressBar'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function Budgets() {
  const today = new Date()
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]

  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])

  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadBudgets() {
    const response = await api.get('/budgets/?month=' + month + '&year=' + year)
    setBudgets(response.data)
  }

  async function loadCategories() {
    const response = await api.get('/categories/')
    setCategories(response.data)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadBudgets()
  }, [month, year])

  function clearForm() {
    setCategoryId('')
    setLimit('')
    setEditingId(null)
  }

  function changeMonth(value) {
    setMonth(Number(value))
    clearForm()
  }

  function changeYear(value) {
    setYear(Number(value))
    clearForm()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    let categoryValue = null
    if (categoryId !== '') {
      categoryValue = Number(categoryId)
    }

    const data = {
      category_id: categoryValue,
      month: month,
      year: year,
      limit_amount: limit,
    }

    try {
      if (editingId === null) {
        await api.post('/budgets/', data)
        setMessage('Budget added.')
      } else {
        await api.put('/budgets/' + editingId + '/', data)
        setMessage('Budget updated.')
      }
      clearForm()
      loadBudgets()
    } catch (err) {
      if (err.response) {
        const errors = err.response.data
        if (errors.error) {
          setError(errors.error)
        } else if (errors.limit_amount) {
          setError(errors.limit_amount[0])
        } else if (errors.category_id) {
          setError(errors.category_id[0])
        } else {
          setError('Could not save the budget.')
        }
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }
  }

  function startEdit(budget) {
    setEditingId(budget.id)
    if (budget.category_id === null) {
      setCategoryId('')
    } else {
      setCategoryId(budget.category_id)
    }
    setLimit(budget.limit_amount)
    setMessage('')
    setError('')
  }

  async function handleDelete(id) {
    const sure = window.confirm('Delete this budget?')
    if (!sure) {
      return
    }

    await api.delete('/budgets/' + id + '/')
    setMessage('Budget deleted.')
    loadBudgets()
  }

  function remainingText(budget) {
    if (budget.remaining >= 0) {
      return '₹' + budget.remaining.toFixed(2) + ' left'
    }
    return '₹' + Math.abs(budget.remaining).toFixed(2) + ' over the limit'
  }

  return (
    <div>
      <h1 className="page-title">Budgets</h1>

      <div className="month-row">
        <select value={month} onChange={(e) => changeMonth(e.target.value)}>
          {monthNames.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select value={year} onChange={(e) => changeYear(e.target.value)}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="section">
        <h3>{editingId === null ? 'Add a budget' : 'Edit budget'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="expense-form">
            <div>
              <label>Applies to</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Overall budget (all categories)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Limit</label>
              <input
                type="number"
                step="0.01"
                placeholder="5000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
          </div>

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}

          <button className="btn btn-small" type="submit">
            {editingId === null ? 'Add budget' : 'Save changes'}
          </button>
          {editingId !== null && (
            <button className="btn-cancel" type="button" onClick={clearForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="section list-section">
        <h3>{monthNames[month - 1] + ' ' + year}</h3>

        {budgets.length === 0 && (
          <p className="muted">No budgets for this month yet. Add one above.</p>
        )}

        {budgets.map((b) => (
          <div className="budget-item" key={b.id}>
            <div className="budget-top">
              <b>{b.category_name}</b>
              <span>{'₹' + b.spent.toFixed(2) + ' of ₹' + b.limit_amount.toFixed(2)}</span>
            </div>

            <ProgressBar percent={b.percent_used} status={b.status} />

            <div className="budget-bottom">
              <span>{b.percent_used + '% used'}</span>
              <span>{remainingText(b)}</span>
            </div>

            <div>
              <button className="btn-edit" onClick={() => startEdit(b)}>
                Edit
              </button>
              <button className="btn-delete" onClick={() => handleDelete(b.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Budgets