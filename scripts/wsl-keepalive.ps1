# WSL keep-alive: نگه‌داشتن WSL زنده تا داکر (بک‌اند/دیتابیس/MinIO) همیشه در دسترس باشد
# اجرا: powershell -NoProfile -ExecutionPolicy Bypass -File wsl-keepalive.ps1
$distro = "Ubuntu"
$interval = 20
while ($true) {
    try {
        wsl -d $distro -- true 2>$null | Out-Null
    } catch {
        Start-Sleep -Seconds 10
    }
    Start-Sleep -Seconds $interval
}
