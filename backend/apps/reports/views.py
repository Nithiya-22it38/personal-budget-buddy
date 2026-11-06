import os

from django.core.files.base import ContentFile
from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.helpers import MONTH_NAMES, get_month_summary
from apps.notifications.helpers import create_notification
from .builders import build_excel, build_pdf
from .models import Report
from .serializers import ReportRequestSerializer


def make_report_info(report):
    return {
        'id': report.id,
        'month': report.month,
        'year': report.year,
        'file_format': report.file_format,
        'file_name': os.path.basename(report.file.name),
        'created_at': report.created_at.isoformat(),
    }


class ReportView(APIView):

    def get(self, request):
        reports = Report.objects.filter(user=request.user).order_by('-id')

        result = []
        for report in reports:
            result.append(make_report_info(report))
        return Response(result)

    def post(self, request):
        serializer = ReportRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        month = serializer.validated_data['month']
        year = serializer.validated_data['year']
        file_format = serializer.validated_data['file_format']

        summary = get_month_summary(request.user, month, year)

        if file_format == 'pdf':
            content = build_pdf(summary)
            extension = 'pdf'
        else:
            content = build_excel(summary)
            extension = 'xlsx'

        file_name = (
            'budgetbuddy-user' + str(request.user.id) + '-'
            + str(year) + '-' + str(month).zfill(2) + '.' + extension
        )

        report = Report(
            user=request.user,
            month=month,
            year=year,
            file_format=file_format,
        )
        report.file.save(file_name, ContentFile(content))

        label = MONTH_NAMES[month - 1] + ' ' + str(year)
        title = 'Report ready: ' + label + ' (' + file_format + ')'
        message = 'Your ' + file_format + ' report for ' + label + ' has been generated. You can download it from the Reports page.'
        create_notification(request.user, 'monthly_report', title, message, once=True)

        return Response(make_report_info(report), status=status.HTTP_201_CREATED)


class ReportDetailView(APIView):

    def find_report(self, request, pk):
        return Report.objects.filter(id=pk, user=request.user).first()

    def delete(self, request, pk):
        report = self.find_report(request, pk)
        if report is None:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        report.file.delete(save=False)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReportDownloadView(APIView):

    def get(self, request, pk):
        report = Report.objects.filter(id=pk, user=request.user).first()
        if report is None:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            opened_file = report.file.open('rb')
        except FileNotFoundError:
            return Response({'error': 'The report file is missing.'}, status=status.HTTP_404_NOT_FOUND)

        file_name = os.path.basename(report.file.name)
        return FileResponse(opened_file, as_attachment=True, filename=file_name)