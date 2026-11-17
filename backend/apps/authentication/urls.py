from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    MeView,
    PremiumRequestDecisionView,
    PremiumRequestListView,
    PremiumRequestView,
    RegisterView,
    UserListView,
    UserRoleView,
    UserStatsView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('users/', UserListView.as_view()),
    path('users/stats/', UserStatsView.as_view()),
    path('users/<int:pk>/role/', UserRoleView.as_view()),
    path('premium-request/', PremiumRequestView.as_view()),
    path('premium-requests/', PremiumRequestListView.as_view()),
    path('premium-requests/<int:pk>/', PremiumRequestDecisionView.as_view()),
]