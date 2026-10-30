from rest_framework import serializers


class ProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    college = serializers.CharField(max_length=150, required=False, allow_blank=True)
    monthly_income = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.college = validated_data.get('college', instance.college)
        instance.monthly_income = validated_data.get('monthly_income', instance.monthly_income)
        instance.save()
        return instance