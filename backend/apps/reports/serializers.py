from rest_framework import serializers


class ReportRequestSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2000, max_value=2100)
    file_format = serializers.CharField()

    def validate_file_format(self, value):
        if value not in ['pdf', 'excel']:
            raise serializers.ValidationError('Format must be pdf or excel.')
        return value