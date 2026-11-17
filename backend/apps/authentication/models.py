from django.contrib.auth.models import AbstractUser
from django.db import models

from common.models import TimeStampedModel

ROLE_CHOICES = [
    ('student', 'Student'),
    ('premium', 'Premium User'),
    ('admin', 'Admin'),
]

REQUEST_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('declined', 'Declined'),
]


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return self.username


class PremiumRequest(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=REQUEST_STATUS_CHOICES, default='pending')

    def __str__(self):
        return self.user.username + ' - ' + self.status