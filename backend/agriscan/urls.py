from django.contrib import admin
from django.urls import path
from scans.views import scans_api

urlpatterns = [path("admin/", admin.site.urls), path("api/scans/", scans_api)]
