from rest_framework.permissions import BasePermission


class IsHomeOwner(BasePermission):

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user