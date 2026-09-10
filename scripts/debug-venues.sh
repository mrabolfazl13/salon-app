#!/bin/bash
echo "=== raw response of /api/v1/venues:"
curl -sv -m 30 http://localhost:8000/api/v1/venues 2>&1 | grep -E "^< HTTP|^< content|error|refused|reset" | head -5
echo "--- body (first 500 chars):"
curl -s -m 30 http://localhost:8000/api/v1/venues | head -c 500
echo ""
echo ""
echo "=== set MinIO bucket to public-read (s3:GetObject):"
# use the minio client if available, else python via backend container
docker exec futsal_backend python - <<'EOF'
from minio import Minio
c = Minio("minio:9000", access_key="minioadmin", secret_key="futsal-minio-secret", secure=False)
bucket = "futsal-venues"
policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"AWS": ["*"]},
        "Action": ["s3:GetObject"],
        "Resource": [f"arn:aws:iam:::bucket/{bucket}/*"]
    }]
}
c.set_bucket_policy(bucket, policy)
print("policy set: public read on", bucket)
EOF
echo ""
python3 -c "import base64; open("/tmp/test-upload.png","wb").write(base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="))"
echo "=== retry fetch uploaded object:"
URL=$(curl -s -X POST http://localhost:8000/api/v1/upload/images \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"phone":"09126412345","password":"Manager123!"}' | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))')" \
  -F "files=@/tmp/test-upload.png" | python3 -c "import json,sys; print(json.load(sys.stdin)['urls'][0])")
echo "url: $URL"
curl -s -o /dev/null -w "%{http_code} %{size_download} bytes\n" "$URL"
