from rest_framework.response import Response
from rest_framework.views import APIView

from .helpers import get_month_summary, get_monthly_trend, read_month_and_year


class SummaryView(APIView):

    def get(self, request):
        month, year = read_month_and_year(request)
        summary = get_month_summary(request.user, month, year)

        return Response({
            'month': summary['month'],
            'year': summary['year'],
            'month_name': summary['month_name'],
            'income_total': summary['income_total'],
            'expense_total': summary['expense_total'],
            'balance': summary['balance'],
            'saved_total': summary['saved_total'],
            'income_by_source': summary['income_by_source'],
            'budgets': summary['budgets'],
        })


class CategorySpendingView(APIView):

    def get(self, request):
        month, year = read_month_and_year(request)
        summary = get_month_summary(request.user, month, year)

        return Response({
            'month': summary['month'],
            'year': summary['year'],
            'total': summary['expense_total'],
            'categories': summary['by_category'],
        })


class TrendView(APIView):

    def get(self, request):
        month, year = read_month_and_year(request)

        count = 6
        months_text = request.GET.get('months', '')
        if months_text.isdigit():
            if int(months_text) >= 1 and int(months_text) <= 12:
                count = int(months_text)

        return Response(get_monthly_trend(request.user, month, year, count))