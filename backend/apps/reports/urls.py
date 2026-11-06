from django.urls import path

from .views import ReportDetailView, ReportDownloadView, ReportView

urlpatterns = [
    path('', ReportView.as_view()),
    path('<int:pk>/', ReportDetailView.as_view()),
    path('<int:pk>/download/', ReportDownloadView.as_view()),
]