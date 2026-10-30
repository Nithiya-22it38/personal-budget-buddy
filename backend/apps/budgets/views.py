from datetime import date

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.models import Expense
from apps.expenses.views import category_allowed
from apps.profiles.models import Profile
from .models import Budget
from .serializers import BudgetSerializer


def get_month_and_year(request):
    today = date.today()
    month = today.month
    year = today.year

    if request.GET.get('month', '').isdigit():
        month = int(request.GET.get('month'))
    if request.GET.get('year', '').isdigit():
        year = int(request.GET.get('year'))

    return month, year


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


def budget_exists(user, category_id, month, year, skip_id=None):
    budgets = Budget.objects.filter(
        user=user, category_id=category_id, month=month, year=year
    )
    if skip_id is not None:
        budgets = budgets.exclude(id=skip_id)
    return budgets.exists()


class BudgetView(APIView):

    def get(self, request):
        month, year = get_month_and_year(request)
        budgets = Budget.objects.filter(user=request.user, month=month, year=year).order_by('id')
        expenses = load_expenses(request.user, month, year)
        alert_percent = get_alert_percent(request.user)

        result = []
        for budget in budgets:
            result.append(make_info(budget, expenses, alert_percent))
        return Response(result)

    def post(self, request):
        serializer = BudgetSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        category_id = serializer.validated_data.get('category_id')
        month = serializer.validated_data['month']
        year = serializer.validated_data['year']

        if category_id is not None and not category_allowed(request.user, category_id):
            return Response(
                {'category_id': ['This category does not exist.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if budget_exists(request.user, category_id, month, year):
            return Response(
                {'error': 'A budget for this category and month already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        budget = serializer.save(user=request.user)
        expenses = load_expenses(request.user, month, year)
        info = make_info(budget, expenses, get_alert_percent(request.user))
        return Response(info, status=status.HTTP_201_CREATED)


class BudgetDetailView(APIView):

    def find_budget(self, request, pk):
        return Budget.objects.filter(id=pk, user=request.user).first()

    def put(self, request, pk):
        budget = self.find_budget(request, pk)
        if budget is None:
            return Response({'error': 'Budget not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BudgetSerializer(budget, data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        category_id = serializer.validated_data.get('category_id')
        month = serializer.validated_data['month']
        year = serializer.validated_data['year']

        if category_id is not None and not category_allowed(request.user, category_id):
            return Response(
                {'category_id': ['This category does not exist.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if budget_exists(request.user, category_id, month, year, skip_id=budget.id):
            return Response(
                {'error': 'A budget for this category and month already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        budget = serializer.save()
        expenses = load_expenses(request.user, month, year)
        info = make_info(budget, expenses, get_alert_percent(request.user))
        return Response(info)

    def delete(self, request, pk):
        budget = self.find_budget(request, pk)
        if budget is None:
            return Response({'error': 'Budget not found.'}, status=status.HTTP_404_NOT_FOUND)

        budget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)