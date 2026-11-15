package ir.salon.app.data.api

import ir.salon.core.model.AuthToken
import ir.salon.core.model.User
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT

/** درخواست/پاسخ ورود و ثبت‌نام — قرینهٔ /auth بک‌اند */
@Serializable
data class LoginRequest(val phone: String, val password: String)

@Serializable
data class RegisterRequest(
    val phone: String,
    val password: String,
    @kotlinx.serialization.SerialName("full_name") val fullName: String,
)

@Serializable
data class UpdateProfileRequest(
    @kotlinx.serialization.SerialName("full_name") val fullName: String? = null,
)

interface AuthApi {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthToken

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthToken

    @POST("auth/refresh")
    suspend fun refresh(@Body body: Map<String, String>): AuthToken

    @GET("auth/me")
    suspend fun me(): User

    @PUT("auth/profile")
    suspend fun updateProfile(@Body body: UpdateProfileRequest): User
}
