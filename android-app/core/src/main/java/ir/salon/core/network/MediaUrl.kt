package ir.salon.core.network

/** آدرس‌دهی مدیا سرور — تصاویر ممکن است نسبی باشند (قرینهٔ toFullUrl وب) */
object MediaUrl {

    /** از API_BASE_URL: https://salon.absadeghi.ir/api/v1/ → https://salon.absadeghi.ir */
    val SERVER_ROOT: String = CoreBuildConfig.API_BASE_URL
        .removeSuffix("/")
        .substringBefore("/api")

    fun full(raw: String?): String {
        val path = raw?.trim().orEmpty()
        if (path.isEmpty()) return ""
        if (path.startsWith("http://") || path.startsWith("https://")) return path
        return SERVER_ROOT.trimEnd('/') + "/" + path.trimStart('/')
    }
}
