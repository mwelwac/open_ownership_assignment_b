from rest_framework import serializers


class ErrorSerializer(serializers.Serializer):
    code = serializers.CharField()
    detail = serializers.CharField()
    errors = serializers.DictField(
        child=serializers.JSONField(),
        allow_empty=True,
        allow_null=True,
    )


class DetailSerializer(serializers.Serializer):
    detail = serializers.CharField()
