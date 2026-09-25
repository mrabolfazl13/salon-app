// فرمان‌های بروزرسانی درون‌برنامه‌ای: دانلود APK با پیشرفت + فراخوانی نصب‌کننده اندروید
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, serde::Serialize)]
struct ProgressPayload {
    received: u64,
    total: u64,
    done: bool,
}

#[tauri::command]
pub async fn download_update(
    app: AppHandle,
    url: String,
    version: String,
) -> Result<String, String> {
    use futures_util::StreamExt;

    let file_name = format!("salon-update-{version}.apk");
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    let dest = cache_dir.join(&file_name);

    let resp = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    let total = resp.content_length().unwrap_or(0);

    use std::io::Write;
    let mut file = std::fs::File::create(&dest).map_err(|e| e.to_string())?;
    let mut stream = resp.bytes_stream();
    let mut received: u64 = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        received += chunk.len() as u64;
        let _ = app.emit("update://progress", ProgressPayload { received, total, done: false });
    }
    file.flush().map_err(|e| e.to_string())?;
    let _ = app.emit("update://progress", ProgressPayload { received, total, done: true });

    Ok(file_name)
}

#[tauri::command]
pub async fn install_update(app: AppHandle, file_name: String) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        use tauri::Manager;
        let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
        let path = cache_dir.join(&file_name).to_string_lossy().into_owned();
        let (tx, rx) = std::sync::mpsc::channel();
        let window = app.get_webview_window("main").ok_or("no main window")?;
        window.with_webview(move |wv| {
            #[cfg(target_os = "android")]
            {
                wv.jni_handle().exec(move |env, activity, _webview| {
                    let result = (|| -> jni::errors::Result<()> {
                        use jni::objects::JValueGen::Int;
                        let pkg = env
                            .call_method(activity, "getPackageName", "()Ljava/lang/String;", &[])?
                            .l()?;
                        let pkg_name = env.get_string(&pkg.into())?.to_string_lossy().into_owned();
                        let authority = env.new_string(format!("{}.fileprovider", pkg_name))?;
                        let jp = env.new_string(&path)?;
                        let file = env.new_object(
                            "java/io/File",
                            "<init>:(Ljava/lang/String;)V",
                            &[(&jp).into()],
                        )?;
                        let uri = env
                            .call_static_method(
                                "androidx/core/content/FileProvider",
                                "getUriForFile",
                                "(Landroid/content/Context;Ljava/lang/String;Ljava/io/File;)Landroid/net/Uri;",
                                &[activity.into(), (&authority).into(), (&file).into()],
                            )?
                            .l()?;
                        let action = env.new_string("android.intent.action.VIEW")?;
                        let intent = env.new_object(
                            "android/content/Intent",
                            "<init>:(Ljava/lang/String;)V",
                            &[(&action).into()],
                        )?;
                        let mime = env.new_string("application/vnd.android.package-archive")?;
                        env.call_method(
                            &intent,
                            "setDataAndType",
                            "(Landroid/net/Uri;Ljava/lang/String;)Landroid/content/Intent;",
                            &[(&uri).into(), (&mime).into()],
                        )?;
                        // FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK
                        env.call_method(
                            &intent,
                            "addFlags",
                            "(I)Landroid/content/Intent;",
                            &[Int(1 | 0x10000000)],
                        )?;
                        env.call_method(
                            activity,
                            "startActivity",
                            "(Landroid/content/Intent;)V",
                            &[(&intent).into()],
                        )?;
                        Ok(())
                    })();
                    let _ = tx.send(result.map_err(|e| e.to_string()));
                });
            }
        })
        .map_err(|e| e.to_string())?;
        rx.recv().map_err(|e| e.to_string())?
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, file_name);
        Err("INSTALL_UNSUPPORTED".into())
    }
}
