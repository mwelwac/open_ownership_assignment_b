from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from accounts.enums import RoleTypes
from accounts.services.password_reset import confirm_password_reset, get_reset_user
from accounts.services.registration import register_applicant


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "uuid",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_staff",
            "is_superuser",
        )
        read_only_fields = fields


class ReviewerCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password", "password_confirm")

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        candidate = User(
            email=attrs["email"],
            first_name=attrs["first_name"],
            last_name=attrs["last_name"],
            role=RoleTypes.REVIEWER,
        )
        try:
            validate_password(attrs["password"], candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages}) from exc
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        return User.objects.create_user(
            password=password,
            role=RoleTypes.REVIEWER,
            **validated_data,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].lower(),
            password=attrs["password"],
        )
        if user is None:
            raise AuthenticationFailed("Invalid email or password.")
        attrs["user"] = user
        return attrs


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password", "password_confirm")

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        candidate = User(
            email=attrs["email"],
            first_name=attrs["first_name"],
            last_name=attrs["last_name"],
        )
        try:
            validate_password(attrs["password"], candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages}) from exc
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        return register_applicant(password=password, **validated_data)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Password is incorrect."})
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.messages}) from exc
        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=("password",))
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmRequestSerializer(serializers.Serializer):
    """Public request body; reset credentials are supplied by the URL."""

    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        user = get_reset_user(uid=attrs["uid"], token=attrs["token"])
        if user is None:
            raise serializers.ValidationError({"token": "The reset link is invalid or expired."})
        try:
            validate_password(attrs["new_password"], user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.messages}) from exc
        attrs["user"] = user
        return attrs

    def save(self):
        return confirm_password_reset(
            user=self.validated_data["user"],
            new_password=self.validated_data["new_password"],
        )
