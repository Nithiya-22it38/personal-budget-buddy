from datetime import date

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.expenses.views import category_allowed
from .helpers import check_budget_alerts, get_alert_percent, load_expenses, make_info
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
        check_budget_alerts(request.user, month, year)

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
        check_budget_alerts(request.user, month, year)

        expenses = load_expenses(request.user, month, year)
        info = make_info(budget, expenses, get_alert_percent(request.user))
        return Response(info)

    def delete(self, request, pk):
        budget = self.find_budget(request, pk)
        if budget is None:
            return Response({'error': 'Budget not found.'}, status=status.HTTP_404_NOT_FOUND)

        budget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)