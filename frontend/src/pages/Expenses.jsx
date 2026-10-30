import { useEffect, useState } from 'react'
import api from '../services/api'

function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])

  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadExpenses() {
    const response = await api.get('/expenses/')
    setExpenses(response.data)
  }

  async function loadCategories() {
    const response = await api.get('/categories/')
    setCategories(response.data)
  }

  useEffect(() => {
    loadExpenses()
    loadCategories()
  }, [])

  function clearForm() {
    setCategoryId('')
    setAmount('')
    setDate('')
    setNote('')
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (categoryId === '') {
      setError('Please choose a category.')
      return
    }

    const data = {
      category_id: Number(categoryId),
      amount: amount,
      date: date,
      note: note,
    }

    try {
      if (editingId === null) {
        await api.post('/expenses/', data)
        setMessage('Expense added.')
      } else {
        await api.put('/expenses/' + editingId + '/', data)
        setMessage('Expense updated.')
      }
      clearForm()
      loadExpenses()
    } catch (err) {
      if (err.response) {
        const errors = err.response.data
        if (errors.amount) {
          setError(errors.amount[0])
        } else if (errors.date) {
          setError(errors.date[0])
        } else if (errors.category_id) {
          setError(errors.category_id[0])
        } else {
          setError('Could not save the expense.')
        }
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id)
    setCategoryId(expense.category_id)
    setAmount(expense.amount)
    setDate(expense.date)
    setNote(expense.note)
    setMessage('')
    setError('')
  }

  async function handleDelete(id) {
    const sure = window.confirm('Delete this expense?')
    if (!sure) {
      return
    }

    await api.delete('/expenses/' + id + '/')
    setMessage('Expense deleted.')
    loadExpenses()
  }

  let total = 0
  for (let i = 0; i < expenses.length; i++) {
    total = total + Number(expenses[i].amount)
  }

  return (
    <div>
      <h1 className="page-title">Expenses</h1>

      <div className="cards">
        <div className="card">
          <p className="card-label">Total Expenses</p>
          <p className="card-value">{'₹' + total.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Number of Expenses</p>
          <p className="card-value">{expenses.length}</p>
        </div>
      </div>

      <div className="section">
        <h3>{editingId === null ? 'Add an expense' : 'Edit expense'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="expense-form">
            <div>
              <label>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="120"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label>Note (optional)</label>
              <input
                type="text"
                placeholder="Lunch"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}

          <button className="btn btn-small" type="submit">
            {editingId === null ? 'Add expense' : 'Save changes'}
          </button>
          {editingId !== null && (
            <button className="btn-cancel" type="button" onClick={clearForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="section list-section">
        <h3>Your expenses</h3>

        {expenses.length === 0 && (
          <p className="muted">No expenses yet. Add your first one above.</p>
        )}

        {expenses.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.category_name}</td>
                    <td>{e.note}</td>
                    <td>{'₹' + e.amount}</td>
                    <td>
                      <button className="btn-edit" onClick={() => startEdit(e)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(e.id)}>
                        Delete
                      </button>
                    </td>
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

export default Expenses