from rest_framework import serializers

from .models import Income


class IncomeSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    source = serializers.CharField(max_length=20)
    date = serializers.DateField()
    note = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate_source(self, value):
        allowed = ['pocket_money', 'scholarship', 'freelance', 'other']
        if value not in allowed:
            raise serializers.ValidationError(
                'Source must be pocket_money, scholarship, freelance or other.'
            )
        return value

    def create(self, validated_data):
        income = Income.objects.create(
            user=validated_data['user'],
            amount=validated_data['amount'],
            source=validated_data['source'],
            date=validated_data['date'],
            note=validated_data.get('note', ''),
        )
        return income

    def update(self, instance, validated_data):
        instance.amount = validated_data['amount']
        instance.source = validated_data['source']
        instance.date = validated_data['date']
        instance.note = validated_data.get('note', '')
        instance.save()
        return instance