from django.urls import path
from .views import DeviceListCreateView, DeviceDetailView, DeviceReadingView, TelemetryView

app_name = 'devices'

urlpatterns = [
    # CRUD устройств
    path('api/rooms/<int:room_id>/devices/', DeviceListCreateView.as_view(), name='device-list-create'),
    path('api/devices/<uuid:pk>/', DeviceDetailView.as_view(), name='device-detail'),
    path('api/devices/<uuid:device_id>/readings/', DeviceReadingView.as_view(), name='device-reading'),
    
    # Телеметрия
    path('api/telemetry/', TelemetryView.as_view(), name='telemetry'),
]