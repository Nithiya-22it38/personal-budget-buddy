from django.urls import path

from .views import GoalDetailView, GoalMoneyView, GoalView

urlpatterns = [
    path('', GoalView.as_view()),
    path('<int:pk>/', GoalDetailView.as_view()),
    path('<int:pk>/money/', GoalMoneyView.as_view()),
]