from rest_framework import serializers


class ProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    college = serializers.CharField(max_length=150, required=False, allow_blank=True)
    monthly_income = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, min_value=0)
    budget_alert_percent = serializers.IntegerField(required=False, min_value=1, max_value=100)
    email_notifications = serializers.BooleanField(required=False)

    def validate_phone(self, value):
        allowed = '0123456789+- '
        for letter in value:
            if letter not in allowed:
                raise serializers.ValidationError('Phone can only have digits, spaces, + and -.')
        return value

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.college = validated_data.get('college', instance.college)
        instance.monthly_income = validated_data.get('monthly_income', instance.monthly_income)
        instance.budget_alert_percent = validated_data.get('budget_alert_percent', instance.budget_alert_percent)
        instance.email_notifications = validated_data.get('email_notifications', instance.email_notifications)
        instance.save()
        return instance