import uuid
from django.db import models
from home.models import Room
from accounts.models import CustomUser

class Device(models.Model):
    """Умное устройство в комнате"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    device_type = models.CharField(max_length=100)  # 'light', 'sensor', 'switch'
    
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="devices"
    )
    
    # Дополнительные поля
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)  # {brand: "Xiaomi", model: "Zigbee"}
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.device_type})"

class DeviceReading(models.Model):
    """Показания устройства (температура, влажность и т.д.)"""
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name="readings"
    )
    
    metric_name = models.CharField(max_length=100)  # 'temperature', 'humidity'
    value = models.FloatField()
    unit = models.CharField(max_length=20, blank=True)  # '°C', '%'
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.metric_name}: {self.value}{self.unit}"