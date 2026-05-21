from django.contrib import admin

from .models import Home, Room


@admin.register(Home)
class HomeAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "name",
        "owner",
        "created_at"
    ]


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "name",
        "home",
        "created_at"
    ]

    filter_horizontal = [
        "owners"
    ]