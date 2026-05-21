from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    EmailTokenObtainPairView,
    RenderLoginViewSet,
    RegisterView,
)

urlpatterns = [
    path("login/", RenderLoginViewSet.login_page, name="login"),
    path("register/", RenderLoginViewSet.register_page, name="register"),

    path(
        "token/",
        EmailTokenObtainPairView.as_view(),
        name="token_obtain_pair"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    path(
        "api/accounts/register/",
        RegisterView.as_view(),
        name="api_register"
    ),
]