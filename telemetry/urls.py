from django.urls import path
from .views import DeviceStatisticsAPIView

app_name = 'telemetry'

urlpatterns = [
    path(
        '<uuid:device_id>/',
        DeviceStatisticsAPIView.as_view(),
        name='device-telemetry'
    ),
]