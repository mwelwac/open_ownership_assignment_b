from django.contrib.auth import login, logout, update_session_auth_hash
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.enums import RoleTypes
from accounts.api.serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ReviewerCreateSerializer,
    RegistrationSerializer,
    UserSerializer,
)
from accounts.models import User
from accounts.services.password_reset import request_password_reset
from core.api_serializers import DetailSerializer, ErrorSerializer


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFTokenView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    @extend_schema(responses={200: DetailSerializer})
    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "login"

    @extend_schema(
        request=LoginSerializer,
        responses={
            200: UserSerializer,
            400: ErrorSerializer,
            403: ErrorSerializer,
            429: ErrorSerializer,
        },
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        login(request, serializer.validated_data["user"])
        return Response(UserSerializer(request.user).data)


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=None, responses={204: None})
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)


@method_decorator(csrf_protect, name="dispatch")
class ReviewerListCreateView(ListCreateAPIView):
    permission_classes = (IsAdminUser,)

    def get_queryset(self):
        return User.objects.filter(role=RoleTypes.REVIEWER).order_by("email")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ReviewerCreateSerializer
        return UserSerializer

    @extend_schema(responses={200: UserSerializer, 403: ErrorSerializer})
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=ReviewerCreateSerializer,
        responses={201: UserSerializer, 400: ErrorSerializer, 403: ErrorSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = ReviewerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reviewer = serializer.save()
        return Response(UserSerializer(reviewer).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class RegistrationView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "registration"

    @extend_schema(
        request=RegistrationSerializer,
        responses={201: UserSerializer, 400: ErrorSerializer, 429: ErrorSerializer},
    )
    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class ReviewerRegistrationView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "registration"

    @extend_schema(
        request=ReviewerCreateSerializer,
        responses={201: UserSerializer, 400: ErrorSerializer, 429: ErrorSerializer},
    )
    def post(self, request):
        serializer = ReviewerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class PasswordChangeView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(request=PasswordChangeSerializer, responses={204: None, 400: ErrorSerializer})
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        update_session_auth_hash(request, user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetRequestView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "password_reset"

    @extend_schema(
        operation_id="auth_password_reset_request",
        request=PasswordResetRequestSerializer,
        responses={202: DetailSerializer, 400: ErrorSerializer, 429: ErrorSerializer},
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_password_reset(
            email=serializer.validated_data["email"],
            request=request,
        )
        return Response(
            {"detail": "If the account exists, password reset instructions have been sent."},
            status=status.HTTP_202_ACCEPTED,
        )


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetConfirmView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "password_reset"

    @extend_schema(
        operation_id="auth_password_reset_confirm",
        request=PasswordResetConfirmRequestSerializer,
        responses={204: None, 400: ErrorSerializer, 429: ErrorSerializer},
    )
    def post(self, request, uid, token):
        data = {**request.data, "uid": uid, "token": token}
        serializer = PasswordResetConfirmSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
