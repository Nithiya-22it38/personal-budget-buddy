from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Income
from .serializers import IncomeSerializer


class IncomeView(APIView):

    def get(self, request):
        incomes = Income.objects.filter(user=request.user).order_by('-date', '-id')
        serializer = IncomeSerializer(incomes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = IncomeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IncomeDetailView(APIView):

    def find_income(self, request, pk):
        return Income.objects.filter(id=pk, user=request.user).first()

    def get(self, request, pk):
        income = self.find_income(request, pk)
        if income is None:
            return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = IncomeSerializer(income)
        return Response(serializer.data)

    def put(self, request, pk):
        income = self.find_income(request, pk)
        if income is None:
            return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = IncomeSerializer(income, data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        income = self.find_income(request, pk)
        if income is None:
            return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)

        income.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)