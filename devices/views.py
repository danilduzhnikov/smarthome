# devices/views.py
import uuid
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from home.models import Room
from accounts.models import CustomUser

from .models import Device, DeviceReading
from .serializers import DeviceSerializer, DeviceCreateSerializer, DeviceReadingSerializer


class DeviceListCreateView(APIView):
    """Получить список устройств в комнате / Создать устройство"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, room_id):
        """GET: Получить все устройства в комнате"""
        devices = Device.objects.filter(
            room__id=room_id,
            room__home__owner=request.user
        ).select_related('room')
        
        return Response(DeviceSerializer(devices, many=True).data)
    
    def post(self, request, room_id):
        """POST: Создать новое устройство в комнате"""
        room = get_object_or_404(
            Room,
            id=room_id,
            home__owner=request.user
        )
        
        data = request.data.copy()
        data["room"] = room.id
        
        serializer = DeviceCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeviceDetailView(APIView):
    """Получить / Обновить / Удалить конкретное устройство"""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        return get_object_or_404(
            Device,
            pk=pk,
            room__home__owner=user
        )
    
    def get(self, request, pk):
        """GET: Получить устройство по ID"""
        device = self.get_object(pk, request.user)
        return Response(DeviceSerializer(device).data)
    
    def put(self, request, pk):
        """PUT: Полное обновление устройства"""
        device = self.get_object(pk, request.user)
        serializer = DeviceCreateSerializer(device, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        """PATCH: Частичное обновление устройства"""
        device = self.get_object(pk, request.user)
        serializer = DeviceCreateSerializer(device, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """DELETE: Удалить устройство"""
        device = self.get_object(pk, request.user)
        device.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DeviceReadingView(APIView):
    """Добавить показание устройства (вручную)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, device_id):
        """POST: Добавить новое показание"""
        device = get_object_or_404(
            Device,
            id=device_id,
            room__home__owner=request.user
        )
        
        data = request.data.copy()
        data['device'] = str(device.id)
        
        serializer = DeviceReadingSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TelemetryView(APIView):
    """
    Прием телеметрии от ESP32 устройств
    ПУБЛИЧНЫЙ ENDPOINT (без аутентификации)
    """
    permission_classes = []
    
    def post(self, request):
        """
        Принимает JSON от ESP32:
        {
            "device_id": "59d32ea1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "temp": 23.5,
            "hum": 65.2
        }
        """
        device_id = request.data.get('device_id')
        temp = request.data.get('temp')
        hum = request.data.get('hum')
        
        # Валидация device_id
        if not device_id:
            return Response(
                {'error': 'device_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Поиск устройства
        try:
            device = Device.objects.get(id=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'device not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Создаем показания
        readings_to_create = []
        now = timezone.now()
        
        if temp is not None:
            try:
                readings_to_create.append(DeviceReading(
                    device=device,
                    metric_name='temp',
                    value=float(temp),
                    unit='°C',
                    timestamp=now
                ))
            except (ValueError, TypeError):
                pass
        
        if hum is not None:
            try:
                readings_to_create.append(DeviceReading(
                    device=device,
                    metric_name='hum',
                    value=float(hum),
                    unit='%',
                    timestamp=now
                ))
            except (ValueError, TypeError):
                pass
        
        # Сохраняем все показания разом
        if readings_to_create:
            DeviceReading.objects.bulk_create(readings_to_create)
        
        return Response(
            {'status': 'ok', 'received': len(readings_to_create)}, 
            status=status.HTTP_200_OK
        )