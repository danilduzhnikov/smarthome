from rest_framework import serializers
from .models import Device, DeviceReading

class DeviceReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceReading
        fields = ['id', 'metric_name', 'value', 'unit', 'timestamp']
        read_only_fields = ['id', 'timestamp']

class DeviceSerializer(serializers.ModelSerializer):
    latest_readings = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = [
            'id', 'name', 'device_type', 'room', 
            'is_active', 'metadata', 'latest_readings', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_latest_readings(self, obj):
        # Возвращаем последние показания по каждому типу метрики
        readings = {}
        for reading in obj.readings.order_by('metric_name', '-timestamp').distinct('metric_name'):
            if reading.metric_name not in readings:
                readings[reading.metric_name] = {
                    'value': reading.value,
                    'unit': reading.unit
                }
        return readings

class DeviceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['name', 'device_type', 'room', 'metadata']