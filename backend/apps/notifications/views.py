from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationView(APIView):

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at', '-id')[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class UnreadCountView(APIView):

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class NotificationReadView(APIView):

    def put(self, request, pk):
        notification = Notification.objects.filter(id=pk, user=request.user).first()
        if notification is None:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save()

        serializer = NotificationSerializer(notification)
        return Response(serializer.data)


class NotificationReadAllView(APIView):

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read.'})