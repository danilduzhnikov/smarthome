from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):    
    username_field = "email"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "email",
            "password",
            "password_confirm"
        ]

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError(
                {"password": "Passwords do not match"}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")

        user = CustomUser.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        return user