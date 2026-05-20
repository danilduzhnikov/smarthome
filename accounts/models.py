from django.db import models
from django.contrib.auth.models import AbstractUser


class UserRole(models.TextChoices):
    OWNER = "owner", "Owner"
    GUEST = "guest", "Guest"
    ADMIN = "admin", "Admin"


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.GUEST,
    )

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.username