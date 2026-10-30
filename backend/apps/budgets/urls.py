from django.urls import path

from .views import BudgetDetailView, BudgetView

urlpatterns = [
    path('', BudgetView.as_view()),
    path('<int:pk>/', BudgetDetailView.as_view()),
]