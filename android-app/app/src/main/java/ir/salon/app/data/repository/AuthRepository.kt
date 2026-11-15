package ir.salon.app.data.repository

import ir.salon.app.data.api.LoginRequest
import ir.salon.app.data.api.RegisterRequest
import ir.salon.app.data.api.UpdateProfileRequest
import ir.salon.core.datastore.SessionStore
import ir.salon.core.model.AuthToken
import ir.salon.core.model.User
import ir.salon.core.model.UserRole
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

/** تنها مرز احراز هویت — interface برای تست‌پذیری */
interface AuthRepository {
    suspend fun login(phone: String, password: String): User
    suspend fun register(phone: String, password: String, fullName: String): User
    suspend fun logout()
    suspend fun currentUser(): User?
    suspend fun updateProfile(fullName: String): User
    suspend fun isManager(): Boolean
    suspend fun isAdmin(): Boolean
}

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: ir.salon.app.data.api.AuthApi,
    private val session: SessionStore,
    private val json: Json,
) : AuthRepository {

    override suspend fun login(phone: String, password: String): User =
        persist(api.login(LoginRequest(phone, password)))

    override suspend fun register(phone: String, password: String, fullName: String): User =
        persist(api.register(RegisterRequest(phone, password, fullName)))

    override suspend fun logout() = session.clear()

    override suspend fun currentUser(): User? {
        val raw = runCatching { api.me() }.getOrNull() ?: return null
        cacheUser(raw)
        return raw
    }

    override suspend fun updateProfile(fullName: String): User =
        api.updateProfile(UpdateProfileRequest(fullName = fullName)).also { cacheUser(it) }

    override suspend fun isManager(): Boolean =
        currentUser()?.role in setOf("venue_manager", "club_admin")

    override suspend fun isAdmin(): Boolean = currentUser()?.role == "super_admin"

    private suspend fun persist(token: AuthToken): User {
        val user = token.user ?: runCatching { api.me() }.getOrNull() ?: User(
            id = 0, phone = "", fullName = null, role = "user",
        )
        session.saveSession(
            accessToken = token.accessToken,
            refreshToken = token.refreshToken,
            userJson = json.encodeToString(User.serializer(), user),
        )
        return user
    }

    private suspend fun cacheUser(user: User) {
        session.saveSession(
            accessToken = session.currentAccessToken() ?: "",
            refreshToken = session.currentRefreshToken() ?: "",
            userJson = json.encodeToString(User.serializer(), user),
        )
    }
}
