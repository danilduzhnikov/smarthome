from django.utils import timezone

from django.db import models
from devices.models import Device


class DeviceMetric(models.Model):
    """
    Stores time-series data points for device metrics.
    Used as source for aggregation and chart rendering.
    """
    device = models.ForeignKey(
        Device, 
        on_delete=models.CASCADE, 
        related_name='metrics'
    )
    metric_type = models.CharField(
        max_length=50,
        help_text="Type of metric: temperature, humidity, power, etc."
    )
    value = models.FloatField()
    timestamp = models.DateTimeField(default=timezone.now, db_index=True) 

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', 'metric_type', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.device.name} - {self.metric_type}: {self.value}"


class AggregatedStat(models.Model):
    """
    Pre-calculated statistics for faster API responses.
    Stores avg/min/max/count for specific periods.
    """
    PERIOD_CHOICES = [
        ('day', 'Last 24 Hours'),
        ('week', 'Last 7 Days'),
        ('month', 'Last 30 Days'),
    ]

    device = models.ForeignKey(
        Device, 
        on_delete=models.CASCADE, 
        related_name='aggregated_stats'
    )
    metric_type = models.CharField(max_length=50)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    avg_value = models.FloatField(default=0)
    min_value = models.FloatField(default=0)
    max_value = models.FloatField(default=0)
    count = models.IntegerField(default=0)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['device', 'metric_type', 'period']
        ordering = ['-calculated_at']

    def __str__(self):
        return f"{self.device.name} {self.metric_type} ({self.period})"