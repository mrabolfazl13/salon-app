# backend/app/api/v1/upload.py
"""آپلود فایل‌ها (عکس سالن‌ها) به MinIO"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List

from app.models.user import User, UserRole
from app.utils.auth import get_current_user
from app.services.storage_service import storage_service, StorageError

router = APIRouter(prefix="/upload", tags=["Upload"])

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_SIZE_MB = 5
MAX_FILES = 10


@router.post("/images")
async def upload_images(
    files: List[UploadFile] = File(..., description="عکس‌های سالن (حداکثر ۱۰ تا، هر کدام تا ۵ مگابایت)"),
    current_user: User = Depends(get_current_user),
):
    """آپلود چندین عکس و برگرداندن URLهای آن‌ها"""
    if current_user.role not in (UserRole.VENUE_MANAGER, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="فقط مدیران سالن می‌توانند عکس آپلود کنند")

    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"حداکثر {MAX_FILES} عکس مجاز است")

    urls: List[str] = []
    for f in files:
        content_type = (f.content_type or "").lower()
        if content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail=f"فرمت {f.filename or content_type} مجاز نیست (فقط jpg, png, webp, gif)")

        data = await f.read()
        if len(data) > MAX_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"حجم {f.filename} بیشتر از {MAX_SIZE_MB} مگابایت است")

        try:
            url = storage_service.upload_bytes(data, f.filename or "image.jpg")
        except StorageError as e:
            raise HTTPException(status_code=503, detail=str(e))
        urls.append(url)

    return {"urls": urls, "count": len(urls)}
