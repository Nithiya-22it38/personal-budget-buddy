from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    category_id = serializers.IntegerField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    date = serializers.DateField()
    note = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def create(self, validated_data):
        expense = Expense.objects.create(
            user=validated_data['user'],
            category_id=validated_data['category_id'],
            amount=validated_data['amount'],
            date=validated_data['date'],
            note=validated_data.get('note', ''),
        )
        return expense

    def update(self, instance, validated_data):
        instance.category_id = validated_data['category_id']
        instance.amount = validated_data['amount']
        instance.date = validated_data['date']
        instance.note = validated_data.get('note', '')
        instance.save()
        return instance