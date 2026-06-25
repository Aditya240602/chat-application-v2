from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source='sender.username', read_only=True
    )
    receiver_username = serializers.CharField(
        source='receiver.username', read_only=True
    )
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'receiver',
            'sender_username',
            'receiver_username',
            'content',
            'attachment',
            'attachment_url',
            'attachment_type',
            'attachment_name',
            'timestamp',
            'is_read',
        ]
        read_only_fields = ['sender', 'timestamp', 'is_read', 'attachment_url']
        extra_kwargs = {
            'attachment': {'write_only': True, 'required': False},
        }

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        from django.conf import settings
        return f"{settings.BACKEND_BASE_URL}{obj.attachment.url}"

    def validate(self, data):
        content = data.get('content', '')
        attachment = data.get('attachment')
        if not content and not attachment:
            raise serializers.ValidationError(
                "A message must have content or an attachment."
            )
        return data

    def create(self, validated_data):
        """
        Set sender from the logged-in user instead of trusting client data.
        Also infer attachment_type and attachment_name from the uploaded file.
        """
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if user is None or not user.is_authenticated:
            raise serializers.ValidationError("User must be authenticated.")

        validated_data['sender'] = user

        attachment = validated_data.get('attachment')
        if attachment is not None:
            validated_data['attachment_name'] = attachment.name
            content_type = getattr(attachment, 'content_type', '') or ''
            validated_data['attachment_type'] = (
                Message.ATTACHMENT_IMAGE
                if content_type.startswith('image/')
                else Message.ATTACHMENT_FILE
            )

        return super().create(validated_data)
