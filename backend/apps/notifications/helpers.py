from .models import Notification


def create_notification(user, notification_type, title, message, once=False):
    title = title[:100]

    if once:
        already = Notification.objects.filter(
            user=user,
            notification_type=notification_type,
            title=title,
        ).exists()
        if already:
            return

    Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
    )