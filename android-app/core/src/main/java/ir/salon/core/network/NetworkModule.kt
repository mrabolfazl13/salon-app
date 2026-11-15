package ir.salon.core.network

import ir.salon.core.datastore.SessionStore
import ir.salon.core.model.AuthToken
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import javax.inject.Inject
import javax.inject.Singleton

/** افزودن هدر Authorization به هر درخواست اگر توکن موجود باشد */
@Singleton
class AuthInterceptor @Inject constructor(
    private val session: SessionStore,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { session.currentAccessToken() }
        val request = if (token.isNullOrBlank()) {
            chain.request()
        } else {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        }
        return chain.proceed(request)
    }
}

@kotlinx.serialization.Serializable
private data class RefreshRequest(val refresh_token: String)

/**
 * Refresh خودکار توکن روی 401 — حداکثر یک تلاش؛ شکست → پاک‌سازی نشست.
 */
@Singleton
class TokenAuthenticator @Inject constructor(
    private val session: SessionStore,
    private val json: Json,
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null // جلوگیری از حلقه
        val refresh = runBlocking { session.currentRefreshToken() } ?: return null

        val refreshUrl = response.request.url
            .newBuilder()
            .encodedPath(
                response.request.url.encodedPath
                    .substringBefore("/auth/") + "/auth/refresh",
            )
            .query(null)
            .build()

        val refreshRequest = Request.Builder()
            .url(refreshUrl)
            .post(json.encodeToString(RefreshRequest(refresh)).toRequestBody("application/json".toMediaType()))
            .build()

        return try {
            runBlocking {
                okhttp3.OkHttpClient().newCall(refreshRequest).execute().use { refreshResponse ->
                    val body = refreshResponse.body?.string()
                    val token = if (refreshResponse.isSuccessful && body != null) {
                        runCatching { json.decodeFromString<AuthToken>(body) }.getOrNull()
                    } else {
                        null
                    }
                    if (token == null) {
                        session.clear()
                        null
                    } else {
                        session.saveTokens(token.accessToken, token.refreshToken)
                        response.request.newBuilder()
                            .header("Authorization", "Bearer ${token.accessToken}")
                            .build()
                    }
                }
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}

/** ارائهٔ Retrofit singleton — baseUrl از BuildConfig ماژول core */
@Singleton
class RetrofitProvider @Inject constructor(
    authInterceptor: AuthInterceptor,
    tokenAuthenticator: TokenAuthenticator,
    json: Json,
) {
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(CoreBuildConfig.API_BASE_URL)
        .client(
            OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .authenticator(tokenAuthenticator)
                .addInterceptor(
                    okhttp3.logging.HttpLoggingInterceptor().apply {
                        level = okhttp3.logging.HttpLoggingInterceptor.Level.BASIC
                    },
                )
                .build(),
        )
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
}
