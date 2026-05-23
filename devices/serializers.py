from rest_framework import serializers
from .models import Device, DeviceReading
from django.utils import timezone
from datetime import timedelta

class DeviceReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceReading
        fields = ['id', 'metric_name', 'value', 'unit', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class DeviceSerializer(serializers.ModelSerializer):
    latest_readings = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = [
            'id', 'name', 'device_type', 'room', 
            'is_active', 'metadata', 'latest_readings', 
            'is_online', 'last_seen', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_latest_readings(self, obj):
        """Возвращает последние показания по каждому типу метрики"""
        readings = {}
        for reading in obj.readings.order_by('metric_name', '-timestamp'):
            if reading.metric_name not in readings:
                readings[reading.metric_name] = {
                    'value': reading.value,
                    'unit': reading.unit,
                    'timestamp': reading.timestamp.isoformat()
                }
        return readings
    
    def get_is_online(self, obj):
        """Проверяет, было ли показание за последнюю минуту"""
        last_reading = obj.readings.order_by('-timestamp').first()
        if not last_reading:
            return False
        
        # Если последнее показание было менее 60 секунд назад
        one_minute_ago = timezone.now() - timedelta(minutes=1)
        return last_reading.timestamp > one_minute_ago
    
    def get_last_seen(self, obj):
        """Возвращает время последнего показания"""
        last_reading = obj.readings.order_by('-timestamp').first()
        if last_reading:
            return last_reading.timestamp.isoformat()
        return None

class DeviceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['name', 'device_type', 'room', 'metadata']
        extra_kwargs = {
            'room': {'required': False}
        }