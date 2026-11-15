package ir.salon.core.common

import kotlinx.serialization.json.Json
import retrofit2.HttpException

/**
 * استاندارد خطا: پیام فارسی همیشه موجود — از detail سرور، از کد HTTP، یا fallback.
 * قرینهٔ err.response?.data?.detail در فرانت‌اند.
 */
sealed interface AppError {
    data class Api(val code: Int?, val message: String) : AppError
    data class Network(val message: String) : AppError
    data class Unknown(val message: String) : AppError

    fun uiMessage(): String = message
}

object AppErrorMapper {

    private val json = Json { ignoreUnknownKeys = true }

    fun from(t: Throwable): AppError = when (t) {
        is HttpException -> {
            val detail = runCatching {
                t.response()?.errorBody()?.string()
            }.getOrNull()?.let { body ->
                runCatching { json.decodeFromString<DetailBody>(body) }.getOrNull()?.detail
            }
            Api(
                code = t.code(),
                message = detail ?: fallbackFor(t.code()),
            )
        }
        is java.io.IOException -> Network("ارتباط با سرور برقرار نشد — اتصال اینترنت را بررسی کنید")
        else -> Unknown("خطای غیرمنتظره رخ داد")
    }

    private fun fallbackFor(code: Int): String = when (code) {
        401 -> "ورود منقضی شده — دوباره وارد شوید"
        403 -> "دسترسی به این بخش ندارید"
        404 -> "موردی یافت نشد"
        422 -> "اطلاعات ارسالی معتبر نیست"
        429 -> "تعداد درخواست‌ها بیش از حد مجاز است — چند لحظه دیگر تلاش کنید"
        in 500..599 -> "خطای سرور — کمی بعد دوباره تلاش کنید"
        else -> "خطای نامشخص (کد $code)"
    }
}

@kotlinx.serialization.Serializable
private data class DetailBody(val detail: String = "")
