from datetime import timedelta
from django.db import models
from django.db.models import Avg
from django.db.models.functions import TruncHour, TruncDay
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from devices.models import Device
from .models import DeviceMetric, AggregatedStat
from .serializers import MetricPointSerializer, AggregatedStatSerializer


class DeviceStatisticsAPIView(APIView):
    PERIOD_MAP = {
        'day': timedelta(days=1),
        'week': timedelta(days=7),
        'month': timedelta(days=30),
    }
    
    AGGREGATION_MAP = {
        'day': 'hour',
        'week': 'day',
        'month': 'day',
    }

    def get(self, request, device_id):
        try:
            device = Device.objects.get(pk=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        period = request.query_params.get('period', 'day').lower()
        if period not in self.PERIOD_MAP:
            period = 'day'

        since = timezone.now() - self.PERIOD_MAP[period]
        aggregation = self.AGGREGATION_MAP[period]

        # Получаем агрегированные данные для графика
        metrics = self._get_aggregated_metrics(device, since, aggregation)

        # Считаем статистику ТОЛЬКО за выбранный период
        stats_data = []
        metric_types = DeviceMetric.objects.filter(
            device=device,
            timestamp__gte=since
        ).values_list('metric_type', flat=True).distinct()
        
        for mtype in metric_types:
            type_metrics = DeviceMetric.objects.filter(
                device=device,
                metric_type=mtype,
                timestamp__gte=since  # ← Важно: только за период!
            )
            agg = type_metrics.aggregate(
                avg=models.Avg('value'),
                min=models.Min('value'),
                max=models.Max('value'),
                count=models.Count('id')
            )
            stats_data.append({
                'metric_type': mtype,
                'avg_value': round(agg['avg'] or 0, 2),
                'min_value': round(agg['min'] or 0, 2),
                'max_value': round(agg['max'] or 0, 2),
                'count': agg['count'] or 0,
            })

        return Response({
            'data_points': metrics,
            'statistics': stats_data,  # ← Теперь без дубликатов
        }, status=status.HTTP_200_OK)

    def _get_aggregated_metrics(self, device, since, aggregation):
        """
        Агрегирует метрики по временным интервалам.
        Возвращает данные сгруппированные по timestamp.
        """
        metrics = DeviceMetric.objects.filter(
            device=device,
            timestamp__gte=since
        )

        if aggregation == 'hour':
            trunc_func = TruncHour('timestamp')
        else:
            trunc_func = TruncDay('timestamp')

        # Группируем по времени и типу метрики
        aggregated = metrics.annotate(
            time_bucket=trunc_func
        ).values('time_bucket', 'metric_type').annotate(
            avg_value=Avg('value')
        ).order_by('time_bucket')

        # Группируем по timestamp для фронтенда
        result = {}
        for item in aggregated:
            time_str = item['time_bucket'].strftime('%Y-%m-%dT%H:%M:%SZ')
            if time_str not in result:
                result[time_str] = {'timestamp': time_str}
            result[time_str][item['metric_type']] = round(item['avg_value'], 2)

        # Конвертируем в список и сортируем по времени
        return sorted(result.values(), key=lambda x: x['timestamp'])