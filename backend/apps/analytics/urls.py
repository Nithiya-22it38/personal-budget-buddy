from django.urls import path

from .views import CategorySpendingView, SummaryView, TrendView

urlpatterns = [
    path('summary/', SummaryView.as_view()),
    path('categories/', CategorySpendingView.as_view()),
    path('trend/', TrendView.as_view()),
]