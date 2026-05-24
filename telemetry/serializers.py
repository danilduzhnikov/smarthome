from rest_framework import serializers
from .models import DeviceMetric, AggregatedStat


class MetricPointSerializer(serializers.ModelSerializer):
    """Serializer for individual chart data points"""
    timestamp = serializers.DateTimeField(format='%Y-%m-%dT%H:%M:%S')

    class Meta:
        model = DeviceMetric
        fields = ['value', 'timestamp']


class AggregatedStatSerializer(serializers.ModelSerializer):
    """Serializer for summary statistics panel"""
    class Meta:
        model = AggregatedStat
        fields = ['metric_type', 'avg_value', 'min_value', 'max_value', 'count']


class ChartDataResponseSerializer(serializers.Serializer):
    """Combined response for chart + stats in one request"""
    period = serializers.CharField()
    data_points = MetricPointSerializer(many=True)
    statistics = AggregatedStatSerializer(many=True)