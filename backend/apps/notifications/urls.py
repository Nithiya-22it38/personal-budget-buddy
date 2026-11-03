from django.urls import path

from .views import (
    NotificationReadAllView,
    NotificationReadView,
    NotificationView,
    UnreadCountView,
)

urlpatterns = [
    path('', NotificationView.as_view()),
    path('unread-count/', UnreadCountView.as_view()),
    path('read-all/', NotificationReadAllView.as_view()),
    path('<int:pk>/read/', NotificationReadView.as_view()),
]