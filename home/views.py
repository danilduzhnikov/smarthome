from django.db.models import Count
from django.shortcuts import get_object_or_404, render

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Home, Room
# from device.models import Device

from .serializers import (
    HomeSerializer,
    RoomSerializer,
    RoomCreateSerializer
)


class RenderHomeViewSet:
    @staticmethod
    def base_home_page(request):
        return render(request, "base_home.html")


class HomeListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        homes = Home.objects.filter(owner=request.user)

        return Response(
            HomeSerializer(homes, many=True).data
        )

    def post(self, request):

        serializer = HomeSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save(owner=request.user)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class HomeDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):

        return get_object_or_404(
            Home,
            pk=pk,
            owner=user
        )

    def get(self, request, pk):

        home = self.get_object(pk, request.user)

        return Response(
            HomeSerializer(home).data
        )

    def delete(self, request, pk):

        home = self.get_object(pk, request.user)

        home.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, home_id):

        rooms = Room.objects.filter(
            home__id=home_id,
            home__owner=request.user
        )

        return Response(
            RoomSerializer(rooms, many=True).data
        )

    def post(self, request, home_id):

        home = get_object_or_404(
            Home,
            id=home_id,
            owner=request.user
        )

        data = request.data.copy()
        data["home"] = home.id

        serializer = RoomCreateSerializer(data=data)

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class RoomDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):

        return get_object_or_404(
            Room,
            pk=pk,
            home__owner=user
        )

    def get(self, request, pk):

        room = self.get_object(pk, request.user)

        return Response(
            RoomSerializer(room).data
        )

    def delete(self, request, pk):

        room = self.get_object(pk, request.user)

        room.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class HomeStatsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        homes = Home.objects.filter(
            owner=request.user
        ).annotate(
            rooms_count=Count("rooms"),
            # devices_count=Count("room__device")
        )

        data = [
            {
                "id": home.id,
                "name": home.name,
                "rooms_count": home.rooms_count,
                "devices_count": 15 #home.devices_count
            }
            for home in homes
        ]

        return Response(data)