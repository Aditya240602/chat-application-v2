from django.db import models
from django.contrib.auth.models import User


class Message(models.Model):
    ATTACHMENT_IMAGE = "image"
    ATTACHMENT_FILE = "file"
    ATTACHMENT_TYPE_CHOICES = [
        (ATTACHMENT_IMAGE, "Image"),
        (ATTACHMENT_FILE, "File"),
    ]

    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_messages'
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='received_messages'
    )
    content = models.TextField(blank=True, default="")
    attachment = models.FileField(
        upload_to="chat_attachments/%Y/%m/", null=True, blank=True
    )
    attachment_type = models.CharField(
        max_length=10, choices=ATTACHMENT_TYPE_CHOICES, null=True, blank=True
    )
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["timestamp"]

        indexes = [
            models.Index(fields=["sender", "receiver"]),
            models.Index(fields=["receiver", "is_read"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        if self.attachment:
            return f"{self.sender.username} -> {self.receiver.username}: [attachment] {self.attachment_name}"
        return f"{self.sender.username} -> {self.receiver.username}: {self.content[:20]}"


class Block(models.Model):
    blocker = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocking"
    )
    blocked = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocked_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"