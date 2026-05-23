import sys
from django.core.management.base import BaseCommand
from devices.models import DeviceReading

class Command(BaseCommand):
    help = "Deletes old DeviceReading records if count exceeds 86400."

    def handle(self, *args, **options):
        limit = 86400
        try:
            total_count = DeviceReading.objects.count()
            
            if total_count <= limit:
                sys.exit(0)

            to_delete_count = total_count - limit
            ids_to_delete = list(
                DeviceReading.objects.order_by('timestamp')
                .values_list('id', flat=True)[:to_delete_count]
            )

            batch_size = 1000
            for i in range(0, len(ids_to_delete), batch_size):
                DeviceReading.objects.filter(
                    id__in=ids_to_delete[i:i + batch_size]
                ).delete()

            sys.exit(0)
            
        except Exception:
            sys.exit(1)