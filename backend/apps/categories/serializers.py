from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=50)

    def create(self, validated_data):
        category = Category.objects.create(
            name=validated_data['name'],
            user=validated_data['user'],
        )
        return category