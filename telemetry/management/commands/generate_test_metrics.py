from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from devices.models import Device
from telemetry.models import DeviceMetric


class Command(BaseCommand):
    help = 'Generate test metrics for devices'

    def handle(self, *args, **options):
        devices = Device.objects.all()
        if not devices.exists():
            self.stdout.write(self.style.ERROR('No devices found!'))
            return

        now = timezone.now()
        metrics_to_create = []

        for device in devices:
            # Генерируем данные за 30 дней (каждые 30 минут)
            for hours_ago in range(30 * 24 * 2):  # 1440 точек
                timestamp = now - timedelta(minutes=30 * hours_ago)
                
                # Temperature
                metrics_to_create.append(DeviceMetric(
                    device=device,
                    metric_type='temperature',
                    value=round(20 + random.uniform(-3, 5) + (hours_ago % 24) * 0.1, 2),
                    timestamp=timestamp,
                ))
                
                # Humidity
                metrics_to_create.append(DeviceMetric(
                    device=device,
                    metric_type='humidity',
                    value=round(60 + random.uniform(-10, 15), 2),
                    timestamp=timestamp,
                ))

        # Bulk create для скорости
        DeviceMetric.objects.bulk_create(metrics_to_create, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(f'Created {len(metrics_to_create)} metrics'))