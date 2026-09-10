# backend/app/services/storage_service.py
"""سرویس ذخیره‌سازی فایل‌ها در MinIO (سازگار با S3)"""
import io
import json
import uuid
import mimetypes
import threading
import logging

from minio import Minio
from app.config import settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    pass


class StorageService:
    _client: "Minio | None" = None
    _lock = threading.Lock()

    @classmethod
    def _get_client(cls) -> Minio:
        if cls._client is None:
            with cls._lock:
                if cls._client is None:
                    cls._client = Minio(
                        settings.MINIO_ENDPOINT,
                        access_key=settings.MINIO_ACCESS_KEY,
                        secret_key=settings.MINIO_SECRET_KEY,
                        secure=settings.MINIO_SECURE,
                    )
        return cls._client

    def _ensure_bucket(self, client: Minio):
        if not client.bucket_exists(settings.MINIO_BUCKET):
            client.make_bucket(settings.MINIO_BUCKET)
        # دسترسی عمومی فقط برای خواندن (نمایش عکس‌ها در فرانت‌اند)
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET}/*"],
                }
            ],
        }
        try:
            # minio SDK string (JSON) می‌خواهد، نه dict
            client.set_bucket_policy(settings.MINIO_BUCKET, json.dumps(policy))
        except Exception as e:  # noqa: BLE001
            logger.warning("could not set bucket policy: %s", e)

    @property
    def public_base_url(self) -> str:
        if settings.MINIO_PUBLIC_URL:
            return settings.MINIO_PUBLIC_URL.rstrip("/")
        scheme = "https" if settings.MINIO_SECURE else "http"
        return f"{scheme}://{settings.MINIO_ENDPOINT}"

    def upload_bytes(self, data: bytes, filename: str = "image.jpg") -> str:
        """آپلود بایت‌ها و برگرداندن URL عمومی فایل"""
        client = self._get_client()
        try:
            self._ensure_bucket(client)
        except Exception as e:
            raise StorageError(f"MinIO در دسترس نیست: {e}") from e

        ext = mimetypes.guess_extension(mimetypes.guess_type(filename)[0] or "") or ""
        if not ext:
            ext = ".jpg"
        object_name = f"venues/{uuid.uuid4().hex}{ext}"
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

        try:
            client.put_object(
                settings.MINIO_BUCKET,
                object_name,
                io.BytesIO(data),
                length=len(data),
                content_type=content_type,
            )
        except Exception as e:
            raise StorageError(f"خطا در آپلود به MinIO: {e}") from e

        return f"{self.public_base_url}/{settings.MINIO_BUCKET}/{object_name}"


storage_service = StorageService()
