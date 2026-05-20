from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    login = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return self.username
