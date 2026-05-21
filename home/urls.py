from django.urls import path

from .views import (
    HomeListCreateView,
    HomeDetailView,
    RoomListCreateView,
    RoomDetailView,
    RenderHomeViewSet,
    HomeStatsView,
)


urlpatterns = [

    path("", RenderHomeViewSet.base_home_page, name="base_home"),

    path(
        "api/homes/stats/",
        HomeStatsView.as_view(),
        name="home_stats"
    ),

    path(
        "api/homes/",
        HomeListCreateView.as_view(),
        name="home_list_create"
    ),

    path(
        "api/homes/<int:pk>/",
        HomeDetailView.as_view(),
        name="home_detail"
    ),

    path(
        "api/homes/<int:home_id>/rooms/",
        RoomListCreateView.as_view(),
        name="room_list_create"
    ),

    path(
        "api/rooms/<int:pk>/",
        RoomDetailView.as_view(),
        name="room_detail"
    ),
]