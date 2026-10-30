from django.urls import path

from .views import ExpenseDetailView, ExpenseView

urlpatterns = [
    path('', ExpenseView.as_view()),
    path('<int:pk>/', ExpenseDetailView.as_view()),
]