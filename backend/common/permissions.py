from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    message = 'Only admins can do this.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'


class IsPremiumOrAdmin(BasePermission):
    message = 'This feature is for premium users.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['premium', 'admin']


class IsOwner(BasePermission):

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user