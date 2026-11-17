import { useEffect, useState } from 'react'
import api from '../services/api'
import PremiumRequestBox from '../components/PremiumRequestBox'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const formatNames = {
  pdf: 'PDF',
  excel: 'Excel',
}

function Reports() {
  const today = new Date()
  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]

  const [role, setRole] = useState(null)
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [fileFormat, setFileFormat] = useState('pdf')

  const [reports, setReports] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadReports() {
    const response = await api.get('/reports/')
    setReports(response.data)
  }

  useEffect(() => {
    async function loadData() {
      const me = await api.get('/auth/me/')
      setRole(me.data.role)

      if (me.data.role !== 'student') {
        loadReports()
      }
    }
    loadData()
  }, [])

  async function handleDownload(report) {
    const response = await api.get('/reports/' + report.id + '/download/', {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = report.file_name
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  async function handleGenerate(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    setBusy(true)

    try {
      const response = await api.post('/reports/', {
        month: month,
        year: year,
        file_format: fileFormat,
      })

      await handleDownload(response.data)
      setMessage('Report created and downloaded.')
      loadReports()
    } catch (err) {
      if (err.response && err.response.data.error) {
        setError(err.response.data.error)
      } else if (err.response && err.response.status === 403) {
        setError('Reports are only available to premium users.')
      } else if (err.response) {
        setError('Could not create the report. Check the month, year and format.')
      } else {
        setError('Cannot reach the server. Is the backend running?')
      }
    }

    setBusy(false)
  }

  async function handleDelete(id) {
    const sure = window.confirm('Delete this report?')
    if (!sure) {
      return
    }

    await api.delete('/reports/' + id + '/')
    setMessage('Report deleted.')
    loadReports()
  }

  if (role === null) {
    return <p>Loading...</p>
  }

  if (role === 'student') {
    return (
      <div>
        <h1 className="page-title">Reports</h1>

        <div className="section">
          <h3>Reports are a premium feature</h3>
          <p className="muted">
            Premium users can generate and download monthly PDF and Excel reports with their
            income, expenses, budgets and savings. Send a request, and an admin will review it.
          </p>
          <PremiumRequestBox />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Reports</h1>

      <div className="section">
        <h3>Generate a monthly report</h3>
        <p className="muted">
          The report contains your income, expenses, spending by category, budgets and savings for the month.
        </p>

        <form onSubmit={handleGenerate}>
          <div className="expense-form">
            <div>
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {monthNames.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Format</label>
              <select value={fileFormat} onChange={(e) => setFileFormat(e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
              </select>
            </div>
          </div>

          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}

          <button className="btn btn-small" type="submit" disabled={busy}>
            {busy ? 'Generating...' : 'Generate report'}
          </button>
        </form>
      </div>

      <div className="section list-section">
        <h3>Your reports</h3>

        {reports.length === 0 && (
          <p className="muted">No reports yet. Generate your first one above.</p>
        )}

        {reports.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Format</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{monthNames[r.month - 1] + ' ' + r.year}</td>
                    <td>{formatNames[r.file_format]}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleDownload(r)}>
                        Download
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(r.id)}>
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

export default Reports