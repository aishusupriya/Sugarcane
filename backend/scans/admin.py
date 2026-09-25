from django.contrib import admin
from .models import Scan

@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ("disease", "severity", "confidence", "field_name", "created_at")
    list_filter = ("disease", "severity", "created_at")
    search_fields = ("disease", "field_name")
