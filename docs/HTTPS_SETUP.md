# HTTPS Setup Guide for Production

## Overview

Production deployment uses HTTPS with Let's Encrypt certificates and Nginx reverse proxy.

## Configuration Changes Made

### 1. Backend `.env` Updates
```bash
ALLOWED_ORIGINS=...,https://salon.absadeghi.ir
MINIO_PUBLIC_URL=https://salon.absadeghi.ir/minio
```

### 2. Docker Compose Updates
All services now use `https://salon.absadeghi.ir/minio` as MINIO_PUBLIC_URL.

### 3. Nginx Configuration
- **Port 80**: Redirects all HTTP traffic to HTTPS (except ACME challenge)
- **Port 443**: Serves HTTPS with SSL certificates
- **MinIO Proxy**: Images served via `/minio/futsal-venues/...` path
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.

## SSL Certificate Setup

### Option A: Let's Encrypt (Recommended)

1. Install certbot on host:
```bash
sudo apt install certbot
```

2. Get certificate:
```bash
certbot certonly --standalone -d salon.absadeghi.ir \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

3. Copy certificates to project:
```bash
sudo cp /etc/letsencrypt/live/salon.absadeghi.ir/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/salon.absadeghi.ir/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem
```

4. Auto-renewal (add to crontab):
```bash
0 3 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/salon.absadeghi.ir/fullchain.pem /path/to/project/ssl/ && \
  cp /etc/letsencrypt/live/salon.absadeghi.ir/privkey.pem /path/to/project/ssl/ && \
  docker restart futsal_nginx
```

### Option B: Self-Signed (Development Only)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/privkey.pem \
  -out ssl/fullchain.pem \
  -subj "/CN=salon.absadeghi.ir"
```

⚠️ Browsers will show security warnings with self-signed certs.

## MinIO URL Resolution

Images uploaded to MinIO are accessible via:
```
https://salon.absadeghi.ir/minio/futsal-venues/{filename}
```

Nginx strips the `/minio` prefix and proxies to:
```
http://minio:9000/futsal-venues/{filename}
```

## Testing

1. Verify HTTPS redirect:
```bash
curl -I http://salon.absadeghi.ir
# Should return 301 redirect to https://
```

2. Check image serving:
```bash
curl -I https://salon.absadeghi.ir/minio/futsal-venues/test.jpg
# Should return 200 or 404 (if file doesn't exist)
```

3. Test API over HTTPS:
```bash
curl https://salon.absadeghi.ir/api/v1/health
```

## Troubleshooting

### Certificate not found
Ensure `./ssl/fullchain.pem` and `./ssl/privkey.pem` exist before starting containers.

### Mixed content errors
Check that `MINIO_PUBLIC_URL` starts with `https://` in production.

### CORS errors
Verify `https://salon.absadeghi.ir` is in `ALLOWED_ORIGINS`.
