from django.urls import path

from .views import IncomeDetailView, IncomeView

urlpatterns = [
    path('', IncomeView.as_view()),
    path('<int:pk>/', IncomeDetailView.as_view()),
]