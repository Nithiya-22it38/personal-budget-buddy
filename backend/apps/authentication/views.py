from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.helpers import create_notification, notify_admins
from common.permissions import IsAdmin
from .models import PremiumRequest, User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            title = 'New student registered: ' + user.username
            message = (
                'A new student, ' + user.username + ' (' + user.email + '), has registered. '
                'You can change their role on the Users page.'
            )
            notify_admins('new_user', title, message)

            return Response(
                {'message': 'Account created successfully.'},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
        })


class UserListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by('id')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class UserStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)

        return Response({
            'total': User.objects.count(),
            'students': User.objects.filter(role='student').count(),
            'premium': User.objects.filter(role='premium').count(),
            'admins': User.objects.filter(role='admin').count(),
            'new_this_week': User.objects.filter(date_joined__gte=week_ago).count(),
        })


class UserRoleView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        user = User.objects.filter(id=pk).first()
        if user is None:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role')
        if new_role not in ['student', 'premium', 'admin']:
            return Response(
                {'error': 'Role must be student, premium or admin.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.id == request.user.id and new_role != 'admin':
            return Response(
                {'error': 'You cannot remove your own admin role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_role = user.role
        user.role = new_role
        user.save()

        # a pending premium request is finished once the user is premium or admin
        if new_role in ['premium', 'admin']:
            PremiumRequest.objects.filter(user=user, status='pending').update(status='approved')

        if old_role != new_role:
            title = 'Your account role was changed'
            message = (
                'An admin changed your role from ' + old_role.capitalize()
                + ' to ' + new_role.capitalize() + '.'
            )
            create_notification(user, 'role_changed', title, message)

        serializer = UserSerializer(user)
        return Response(serializer.data)


class PremiumRequestView(APIView):

    def get(self, request):
        latest = PremiumRequest.objects.filter(user=request.user).order_by('-id').first()

        status_text = 'none'
        if latest is not None:
            if latest.status == 'pending':
                status_text = 'pending'
            elif latest.status == 'declined':
                status_text = 'declined'

        return Response({'role': request.user.role, 'status': status_text})

    def post(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'You already have premium or admin access.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        already_pending = PremiumRequest.objects.filter(user=request.user, status='pending').exists()
        if already_pending:
            return Response(
                {'error': 'You already have a pending request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        PremiumRequest.objects.create(user=request.user)

        title = 'Premium request from ' + request.user.username
        message = (
            request.user.username + ' (' + request.user.email + ') asked for premium access. '
            'You can approve or decline the request on the Users page.'
        )
        notify_admins('premium_request', title, message)

        return Response({'status': 'pending'}, status=status.HTTP_201_CREATED)


class PremiumRequestListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        pending = PremiumRequest.objects.filter(status='pending').order_by('created_at')

        result = []
        for item in pending:
            result.append({
                'id': item.id,
                'username': item.user.username,
                'email': item.user.email,
                'requested_at': item.created_at.isoformat(),
            })
        return Response(result)


class PremiumRequestDecisionView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        premium_request = PremiumRequest.objects.filter(id=pk, status='pending').first()
        if premium_request is None:
            return Response(
                {'error': 'Request not found or already handled.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        decision = request.data.get('decision')
        if decision not in ['approve', 'decline']:
            return Response(
                {'error': 'Decision must be approve or decline.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = premium_request.user

        if decision == 'approve':
            if user.role == 'student':
                user.role = 'premium'
                user.save()
            premium_request.status = 'approved'
            premium_request.save()

            title = 'Premium request approved'
            message = 'An admin approved your request. You now have premium access, including report downloads.'
        else:
            premium_request.status = 'declined'
            premium_request.save()

            title = 'Premium request declined'
            message = 'An admin declined your premium request. You can send a new request later.'

        create_notification(user, 'premium_decision', title, message)

        return Response({'message': 'Request handled.'})