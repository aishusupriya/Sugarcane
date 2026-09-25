from django.db import models

class Scan(models.Model):
    disease = models.CharField(max_length=40)
    severity = models.CharField(max_length=20)
    confidence = models.FloatField()
    field_name = models.CharField(max_length=120, blank=True)
    rgb_image = models.ImageField(upload_to="scans/rgb/", blank=True)
    thermal_image = models.ImageField(upload_to="scans/thermal/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.disease} ({self.confidence:.1%})"
