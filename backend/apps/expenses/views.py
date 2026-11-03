from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.budgets.helpers import check_budget_alerts
from apps.categories.models import Category
from .models import Expense
from .serializers import ExpenseSerializer


def category_allowed(user, category_id):
    category = Category.objects.filter(id=category_id).first()

    if category is None:
        return False
    if category.user is None:
        return True
    return category.user == user


class ExpenseView(APIView):

    def get(self, request):
        expenses = Expense.objects.filter(user=request.user).order_by('-date', '-id')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        category_id = serializer.validated_data['category_id']
        if not category_allowed(request.user, category_id):
            return Response(
                {'category_id': ['This category does not exist.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense = serializer.save(user=request.user)
        check_budget_alerts(request.user, expense.date.month, expense.date.year)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):

    def find_expense(self, request, pk):
        return Expense.objects.filter(id=pk, user=request.user).first()

    def get(self, request, pk):
        expense = self.find_expense(request, pk)
        if expense is None:
            return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExpenseSerializer(expense)
        return Response(serializer.data)

    def put(self, request, pk):
        expense = self.find_expense(request, pk)
        if expense is None:
            return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExpenseSerializer(expense, data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        category_id = serializer.validated_data['category_id']
        if not category_allowed(request.user, category_id):
            return Response(
                {'category_id': ['This category does not exist.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense = serializer.save()
        check_budget_alerts(request.user, expense.date.month, expense.date.year)

        return Response(serializer.data)

    def delete(self, request, pk):
        expense = self.find_expense(request, pk)
        if expense is None:
            return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)

        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)