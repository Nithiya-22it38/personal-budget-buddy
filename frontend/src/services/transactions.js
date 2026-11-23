import api from './api'

const sourceNames = {
  pocket_money: 'Pocket money',
  scholarship: 'Scholarship',
  freelance: 'Freelance',
  other: 'Other',
}

export async function getTransactions() {
  const incomeRequest = api.get('/incomes/')
  const expenseRequest = api.get('/expenses/')

  const incomeResponse = await incomeRequest
  const expenseResponse = await expenseRequest

  const all = []

  for (let i = 0; i < incomeResponse.data.length; i++) {
    const item = incomeResponse.data[i]
    all.push({
      id: 'income-' + item.id,
      type: 'income',
      typeLabel: 'Income',
      date: item.date,
      title: sourceNames[item.source],
      note: item.note,
      amount: Number(item.amount),
    })
  }

  for (let i = 0; i < expenseResponse.data.length; i++) {
    const item = expenseResponse.data[i]
    all.push({
      id: 'expense-' + item.id,
      type: 'expense',
      typeLabel: 'Expense',
      date: item.date,
      title: item.category_name,
      note: item.note,
      amount: Number(item.amount),
    })
  }

  all.sort(function (a, b) {
    if (a.date < b.date) {
      return 1
    }
    if (a.date > b.date) {
      return -1
    }
    return 0
  })

  return all
}

export function amountText(transaction) {
  if (transaction.type === 'income') {
    return '+₹' + transaction.amount.toFixed(2)
  }
  return '-₹' + transaction.amount.toFixed(2)
}