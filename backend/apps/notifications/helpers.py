from django.conf import settings
from django.core.mail import send_mail

from apps.authentication.models import User
from apps.profiles.models import Profile
from .models import Notification


def send_email_for_notification(user, title, message):
    # no email address means nothing to send
    if not user.email:
        return

    # the student can switch emails off in their profile
    profile = Profile.objects.filter(user=user).first()
    if profile is not None and not profile.email_notifications:
        return

    body = 'Hello ' + user.username + ',\n\n' + message + '\n\n- BudgetBuddy'

    try:
        send_mail(
            subject='BudgetBuddy: ' + title,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except Exception as error:
        print('Email could not be sent:', error)


def create_notification(user, notification_type, title, message, once=False, send_email=True):
    # the title column only holds 100 characters
    title = title[:100]

    # if once is True, do nothing when the same alert already exists
    if once:
        already_sent = Notification.objects.filter(
            user=user,
            notification_type=notification_type,
            title=title,
        ).exists()
        if already_sent:
            return

    Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
    )

    if send_email:
        send_email_for_notification(user, title, message)


def notify_admins(notification_type, title, message):
    admins = User.objects.filter(role='admin', is_active=True)

    for admin in admins:
        create_notification(admin, notification_type, title, message, send_email=False)