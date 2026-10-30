from rest_framework import serializers

from .models import Budget


class BudgetSerializer(serializers.Serializer):
    category_id = serializers.IntegerField(required=False, allow_null=True)
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2000, max_value=2100)
    limit_amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_limit_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Limit must be greater than zero.')
        return value

    def create(self, validated_data):
        budget = Budget.objects.create(
            user=validated_data['user'],
            category_id=validated_data.get('category_id'),
            month=validated_data['month'],
            year=validated_data['year'],
            limit_amount=validated_data['limit_amount'],
        )
        return budget

    def update(self, instance, validated_data):
        instance.category_id = validated_data.get('category_id')
        instance.month = validated_data['month']
        instance.year = validated_data['year']
        instance.limit_amount = validated_data['limit_amount']
        instance.save()
        return instance