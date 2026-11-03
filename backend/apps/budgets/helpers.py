from apps.expenses.models import Expense
from apps.notifications.helpers import create_notification
from apps.profiles.models import Profile
from .models import Budget


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


def check_budget_alerts(user, month, year):
    budgets = Budget.objects.filter(user=user, month=month, year=year)
    expenses = load_expenses(user, month, year)
    alert_percent = get_alert_percent(user)
    month_text = str(month) + '/' + str(year)

    for budget in budgets:
        info = make_info(budget, expenses, alert_percent)

        if budget.category is None:
            label = 'Overall budget'
        else:
            label = budget.category.name + ' budget'

        numbers = 'Spent ₹' + str(info['spent']) + ' of ₹' + str(info['limit_amount']) + '.'

        if info['status'] == 'over':
            title = label + ' exceeded (' + month_text + ')'
            message = 'You have gone over the ' + label + ' for ' + month_text + '. ' + numbers
            create_notification(user, 'overspending', title, message, once=True)

        elif info['status'] == 'warning':
            title = label + ' alert (' + month_text + ')'
            message = (
                'You have used ' + str(info['percent_used']) + '% of the '
                + label + ' for ' + month_text + '. ' + numbers
            )
            create_notification(user, 'budget_alert', title, message, once=True)