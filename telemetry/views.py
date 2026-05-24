from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from devices.models import Device
from .models import DeviceMetric, AggregatedStat
from .serializers import (
    MetricPointSerializer, 
    AggregatedStatSerializer
)


class DeviceStatisticsAPIView(APIView):
    """
    Unified endpoint returning both chart chunks and average stats.
    GET /api/statistics/<device_id>/?period=day|week|month
    """
    
    PERIOD_MAP = {
        'day': timedelta(days=1),
        'week': timedelta(days=7),
        'month': timedelta(days=30),
    }

    def get(self, request, device_id):
        # Validate device existence
        try:
            device = Device.objects.get(pk=device_id)
        except Device.DoesNotExist:
            return Response(
                {'error': 'Device not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Get period from query params, default to 'day'
        period = request.query_params.get('period', 'day').lower()
        if period not in self.PERIOD_MAP:
            period = 'day'

        since = timezone.now() - self.PERIOD_MAP[period]

        # Fetch raw data points for the chart
        metrics = DeviceMetric.objects.filter(
            device=device,
            timestamp__gte=since
        ).order_by('timestamp')

        # Fetch or calculate aggregated statistics
        stats = AggregatedStat.objects.filter(
            device=device,
            period=period
        )

        # If no pre-calculated stats exist, compute on-the-fly
        if not stats.exists():
            stats_data = []
            metric_types = metrics.values_list('metric_type', flat=True).distinct()
            
            for mtype in metric_types:
                type_metrics = metrics.filter(metric_type=mtype)
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
        else:
            stats_data = AggregatedStatSerializer(stats, many=True).data

        response_data = {
            'period': period,
            'device_name': device.name,
            'data_points': MetricPointSerializer(metrics, many=True).data,
            'statistics': stats_data,
        }

        return Response(response_data, status=status.HTTP_200_OK)