from rest_framework import serializers

from .models import Home, Room


class RoomSerializer(serializers.ModelSerializer):

    owners = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True
    )

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "home",
            "owners",
            "created_at"
        ]


class RoomCreateSerializer(serializers.ModelSerializer):

    owner_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "home",
            "owner_ids"
        ]

    def create(self, validated_data):

        owner_ids = validated_data.pop("owner_ids", [])

        room = Room.objects.create(**validated_data)

        if owner_ids:
            room.owners.set(owner_ids)

        return room


class HomeSerializer(serializers.ModelSerializer):

    rooms = RoomSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Home
        fields = [
            "id",
            "name",
            "owner",
            "rooms",
            "created_at"
        ]
        read_only_fields = [
            "owner"
        ]