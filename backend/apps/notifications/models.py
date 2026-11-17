from django.conf import settings
from django.db import models

from common.models import TimeStampedModel

TYPE_CHOICES = [
    ('budget_alert', 'Budget Alert'),
    ('overspending', 'Overspending'),
    ('savings_reminder', 'Savings Reminder'),
    ('goal_milestone', 'Goal Milestone'),
    ('monthly_report', 'Monthly Report'),
    ('new_user', 'New User'),
    ('role_changed', 'Role Changed'),
    ('premium_request', 'Premium Request'),
    ('premium_decision', 'Premium Decision'),
]

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return self.title