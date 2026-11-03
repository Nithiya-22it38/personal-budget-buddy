from apps.expenses.models import Expense
from apps.profiles.models import Profile


def get_alert_percent(user):
    profile = Profile.objects.filter(user=user).first()
    if profile is None:
        return 80
    return profile.budget_alert_percent


def load_expenses(user, month, year):
    expenses = Expense.objects.filter(user=user, date__year=year, date__month=month)
    return list(expenses)


def make_info(budget, expenses, alert_percent):
    spent = 0
    for expense in expenses:
        if budget.category_id is None or expense.category_id == budget.category_id:
            spent = spent + expense.amount

    limit = budget.limit_amount
    percent = round(float(spent) / float(limit) * 100, 1)

    if percent >= 100:
        status_text = 'over'
    elif percent >= alert_percent:
        status_text = 'warning'
    else:
        status_text = 'ok'

    if budget.category is None:
        name = 'Overall budget'
    else:
        name = budget.category.name

    return {
        'id': budget.id,
        'category_id': budget.category_id,
        'category_name': name,
        'month': budget.month,
        'year': budget.year,
        'limit_amount': float(limit),
        'spent': round(float(spent), 2),
        'remaining': round(float(limit - spent), 2),
        'percent_used': percent,
        'status': status_text,
    }