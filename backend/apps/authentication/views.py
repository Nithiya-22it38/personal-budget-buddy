from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdmin
from .models import User
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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

        user.role = new_role
        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data)