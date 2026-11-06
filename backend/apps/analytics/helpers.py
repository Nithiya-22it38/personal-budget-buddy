from apps.budgets.helpers import get_alert_percent, make_info
from apps.budgets.models import Budget
from apps.expenses.models import Expense
from apps.goals.models import GoalContribution
from apps.incomes.models import Income

MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

SOURCE_NAMES = {
    'pocket_money': 'Pocket money',
    'scholarship': 'Scholarship',
    'freelance': 'Freelance',
    'other': 'Other',
}


def get_amount(item):
    return item['amount']


def get_month_summary(user, month, year):
    # 1. load this month's rows from the database
    expenses = list(Expense.objects.filter(user=user, date__year=year, date__month=month).order_by('date', 'id'))
    incomes = list(Income.objects.filter(user=user, date__year=year, date__month=month).order_by('date', 'id'))
    contributions = list(GoalContribution.objects.filter(goal__user=user, date__year=year, date__month=month).order_by('date', 'id'))

    # 2. add up the totals
    income_total = 0
    for income in incomes:
        income_total = income_total + income.amount

    expense_total = 0
    for expense in expenses:
        expense_total = expense_total + expense.amount

    saved_total = 0
    for item in contributions:
        saved_total = saved_total + item.amount

    # 3. spending for each category
    category_totals = {}
    for expense in expenses:
        name = expense.category.name
        if name in category_totals:
            category_totals[name] = category_totals[name] + expense.amount
        else:
            category_totals[name] = expense.amount

    by_category = []
    for name in category_totals:
        amount = category_totals[name]
        share = 0
        if expense_total > 0:
            share = round(float(amount) / float(expense_total) * 100, 1)
        by_category.append({'name': name, 'amount': float(amount), 'percent': share})

    by_category.sort(key=get_amount, reverse=True)

    # 4. budget progress for the month
    budget_rows = []
    alert_percent = get_alert_percent(user)
    for budget in Budget.objects.filter(user=user, month=month, year=year).order_by('id'):
        budget_rows.append(make_info(budget, expenses, alert_percent))

    # 5. rows for the detail tables
    expense_rows = []
    for expense in expenses:
        expense_rows.append({
            'date': str(expense.date),
            'category': expense.category.name,
            'note': expense.note,
            'amount': float(expense.amount),
        })

    income_rows = []
    for income in incomes:
        income_rows.append({
            'date': str(income.date),
            'source': SOURCE_NAMES.get(income.source, income.source),
            'note': income.note,
            'amount': float(income.amount),
        })

    saving_rows = []
    for item in contributions:
        saving_rows.append({
            'date': str(item.date),
            'goal': item.goal.name,
            'amount': float(item.amount),
        })

    return {
        'month': month,
        'year': year,
        'month_name': MONTH_NAMES[month - 1],
        'username': user.username,
        'income_total': float(income_total),
        'expense_total': float(expense_total),
        'balance': float(income_total - expense_total),
        'saved_total': float(saved_total),
        'by_category': by_category,
        'budgets': budget_rows,
        'expenses': expense_rows,
        'incomes': income_rows,
        'savings': saving_rows,
    }