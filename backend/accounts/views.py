from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q, OuterRef, Subquery
from django.contrib.auth.models import User
from django.conf import settings

from .serializers import RegisterSerializer, UserSerializer
from .models import Profile
from .throttling import RegisterThrottle
from chat.models import Message


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]  
    throttle_classes = [RegisterThrottle]

    def post(self, request):
    
        # 1) Check secret key
        secret = request.data.get("secret")
        if secret != settings.REGISTRATION_SECRET:
            return Response(
                {"detail": "Invalid registration secret."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2) Normal registration flow
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    def patch(self, request):
        """
        PATCH /api/me/
        body: { "display_name": "...", "role": "..." }
        Only display_name and role are editable here — username/email are
        left alone to avoid touching auth-identity fields casually.
        """
        serializer = UserSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        current_user = request.user

        # Subquery: latest message exchanged with each user
        latest_messages = (
            Message.objects.filter(
                (
                    Q(sender=current_user, receiver=OuterRef("pk")) |
                    Q(sender=OuterRef("pk"), receiver=current_user)
                )
            )
            .order_by("-timestamp")
        )

        users = (
            User.objects
            .exclude(id=current_user.id)
            .annotate(
                last_message=Subquery(
                    latest_messages.values("content")[:1]
                ),
                last_message_time=Subquery(
                    latest_messages.values("timestamp")[:1]
                ),
            )
            .only("id", "username", "email")
            .order_by("username")
        )

        result = []

        for user in users:

            text = user.last_message or ""

            if len(text) > 40:
                text = text[:40] + "…"

            result.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "last_message": text,
                "last_message_time": user.last_message_time,
            })

        return Response(result)

class UserPresenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = (
            User.objects
            .exclude(id=request.user.id)
            .select_related("profile")
            .only(
                "id",
                "username",
                "profile__last_seen",
            )
        )

        data = [
            {
                "id": user.id,
                "username": user.username,
                "online": user.profile.online,
                "last_seen": user.profile.last_seen,
            }
            for user in users
        ]

        return Response(data)
