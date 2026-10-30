import { useEffect, useState } from 'react'
import api from '../services/api'

const sourceNames = {
  pocket_money: 'Pocket money',
  scholarship: 'Scholarship',
  freelance: 'Freelance',
  other: 'Other',
}

function Incomes() {
  const [incomes, setIncomes] = useState([])

  const [source, setSource] = useState('pocket_money')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadIncomes() {
    const response = await api.get('/incomes/')
    setIncomes(response.data)
  }

  useEffect(() => {
    loadIncomes()
  }, [])

  function clearForm() {
    setSource('pocket_money')
    setAmount('')
    setDate('')
    setNote('')
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    const data = {
      source: source,
      amount: amount,
      date: date,
      note: note,
    }

    try {
      if (editingId === null) {
        await api.post('/incomes/', data)
        setMessage('Income added.')
      } else {
        await api.put('/incomes/' + editingId + '/', data)
        setMessage('Income updated.')
      }
      clearForm()
      loadIncomes()
    } catch (err) {
      if (err.response) {
        const errors = err.response.data
        if (errors.amount) {
          setError(errors.amount[0])
        } else if (errors.date) {
          setError(errors.date[0])
        } else if (errors.source) {
          setError(errors.source[0])
        } else {
          setError('Could not save the income.')
        }
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }
  }

  function startEdit(income) {
    setEditingId(income.id)
    setSource(income.source)
    setAmount(income.amount)
    setDate(income.date)
    setNote(income.note)
    setMessage('')
    setError('')
  }

  async function handleDelete(id) {
    const sure = window.confirm('Delete this income?')
    if (!sure) {
      return
    }

    await api.delete('/incomes/' + id + '/')
    setMessage('Income deleted.')
    loadIncomes()
  }

  let total = 0
  for (let i = 0; i < incomes.length; i++) {
    total = total + Number(incomes[i].amount)
  }

  return (
    <div>
      <h1 className="page-title">Income</h1>

      <div className="cards">
        <div className="card">
          <p className="card-label">Total Income</p>
          <p className="card-value">{'₹' + total.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="card-label">Number of Entries</p>
          <p className="card-value">{incomes.length}</p>
        </div>
      </div>

      <div className="section">
        <h3>{editingId === null ? 'Add income' : 'Edit income'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="expense-form">
            <div>
              <label>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="pocket_money">Pocket money</option>
                <option value="scholarship">Scholarship</option>
                <option value="freelance">Freelance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="5000"
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
                placeholder="October pocket money"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}

          <button className="btn btn-small" type="submit">
            {editingId === null ? 'Add income' : 'Save changes'}
          </button>
          {editingId !== null && (
            <button className="btn-cancel" type="button" onClick={clearForm}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="section list-section">
        <h3>Your income</h3>

        {incomes.length === 0 && (
          <p className="muted">No income yet. Add your first entry above.</p>
        )}

        {incomes.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Note</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((i) => (
                  <tr key={i.id}>
                    <td>{i.date}</td>
                    <td>{sourceNames[i.source]}</td>
                    <td>{i.note}</td>
                    <td>{'₹' + i.amount}</td>
                    <td>
                      <button className="btn-edit" onClick={() => startEdit(i)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(i.id)}>
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

export default Incomes