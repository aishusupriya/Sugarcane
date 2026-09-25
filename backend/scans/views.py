import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Scan

@csrf_exempt
def scans_api(request):
    if request.method == "GET":
        return JsonResponse({"scans": list(Scan.objects.values("id", "disease", "severity", "confidence", "field_name", "created_at"))})
    if request.method == "POST":
        scan = Scan.objects.create(
            disease=request.POST.get("disease", "Rust"),
            severity=request.POST.get("severity", "Moderate"),
            confidence=float(request.POST.get("confidence", "0.882")),
            field_name=request.POST.get("field_name", ""),
            rgb_image=request.FILES.get("rgb_image"),
            thermal_image=request.FILES.get("thermal_image"),
        )
        return JsonResponse({"id": scan.id, "disease": scan.disease, "severity": scan.severity, "confidence": scan.confidence}, status=201)
    return JsonResponse({"error": "Method not allowed"}, status=405)
