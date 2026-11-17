from datetime import date

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


def make_share_list(totals, grand_total):
    # totals is a dictionary like {'Food': 600, 'Travel': 200}
    rows = []
    for name in totals:
        amount = totals[name]
        share = 0
        if grand_total > 0:
            share = round(float(amount) / float(grand_total) * 100, 1)
        rows.append({'name': name, 'amount': float(amount), 'percent': share})

    rows.sort(key=get_amount, reverse=True)
    return rows


def read_month_and_year(request):
    today = date.today()
    month = today.month
    year = today.year

    month_text = request.GET.get('month', '')
    year_text = request.GET.get('year', '')

    if month_text.isdigit():
        if int(month_text) >= 1 and int(month_text) <= 12:
            month = int(month_text)

    if year_text.isdigit():
        if int(year_text) >= 2000 and int(year_text) <= 2100:
            year = int(year_text)

    return month, year


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

    by_category = make_share_list(category_totals, expense_total)

    # 4. income for each source
    source_totals = {}
    for income in incomes:
        name = SOURCE_NAMES.get(income.source, income.source)
        if name in source_totals:
            source_totals[name] = source_totals[name] + income.amount
        else:
            source_totals[name] = income.amount

    by_source = make_share_list(source_totals, income_total)

    # 5. budget progress for the month
    budget_rows = []
    alert_percent = get_alert_percent(user)
    for budget in Budget.objects.filter(user=user, month=month, year=year).order_by('id'):
        budget_rows.append(make_info(budget, expenses, alert_percent))

    # 6. rows for the detail tables
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
        'income_by_source': by_source,
        'budgets': budget_rows,
        'expenses': expense_rows,
        'incomes': income_rows,
        'savings': saving_rows,
    }


def get_month_totals(user, month, year):
    expenses = Expense.objects.filter(user=user, date__year=year, date__month=month)
    incomes = Income.objects.filter(user=user, date__year=year, date__month=month)

    income_total = 0
    for income in incomes:
        income_total = income_total + income.amount

    expense_total = 0
    for expense in expenses:
        expense_total = expense_total + expense.amount

    return float(income_total), float(expense_total)


def get_monthly_trend(user, month, year, count):
    rows = []

    # go back through the months, starting with the oldest
    for steps_back in range(count - 1, -1, -1):
        trend_month = month - steps_back
        trend_year = year

        while trend_month < 1:
            trend_month = trend_month + 12
            trend_year = trend_year - 1

        income_total, expense_total = get_month_totals(user, trend_month, trend_year)

        rows.append({
            'month': trend_month,
            'year': trend_year,
            'label': MONTH_NAMES[trend_month - 1][:3] + ' ' + str(trend_year),
            'income': income_total,
            'expenses': expense_total,
            'balance': round(income_total - expense_total, 2),
        })

    return rows