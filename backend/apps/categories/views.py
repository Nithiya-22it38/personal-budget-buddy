from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category
from .serializers import CategorySerializer


class CategoryView(APIView):

    def get(self, request):
        default_categories = Category.objects.filter(user=None)
        my_categories = Category.objects.filter(user=request.user)
        all_categories = list(default_categories) + list(my_categories)

        serializer = CategorySerializer(all_categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data['name']

        same_default = Category.objects.filter(user=None, name__iexact=name).exists()
        same_own = Category.objects.filter(user=request.user, name__iexact=name).exists()

        if same_default or same_own:
            return Response(
                {'error': 'This category already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)