from django.db import models
from accounts.models import CustomUser


class Home(models.Model):

    name = models.CharField(
        max_length=255
    )

    owner = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="homes"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.name


class Room(models.Model):

    name = models.CharField(
        max_length=255
    )

    home = models.ForeignKey(
        Home,
        on_delete=models.CASCADE,
        related_name="rooms"
    )

    owners = models.ManyToManyField(
        CustomUser,
        related_name="rooms",
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.name} ({self.home.name})"