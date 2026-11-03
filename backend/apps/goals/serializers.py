from rest_framework import serializers

from .models import SavingsGoal


class GoalSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    target_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    deadline = serializers.DateField(required=False, allow_null=True)

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Target must be greater than zero.')
        return value

    def create(self, validated_data):
        goal = SavingsGoal.objects.create(
            user=validated_data['user'],
            name=validated_data['name'],
            target_amount=validated_data['target_amount'],
            deadline=validated_data.get('deadline'),
        )
        return goal

    def update(self, instance, validated_data):
        instance.name = validated_data['name']
        instance.target_amount = validated_data['target_amount']
        instance.deadline = validated_data.get('deadline')
        instance.save()
        return instance


class ContributionSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    date = serializers.DateField(required=False)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value