package ir.salon.core.datastore

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.sessionDataStore by preferencesDataStore(name = "session")

/**
 * نگهداری توکن‌ها و کاربر جاری — تنها مرز ذخیره‌سازی نشست.
 */
@Singleton
class SessionStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private object Keys {
        val ACCESS_TOKEN = stringPreferencesKey("access_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val USER_JSON = stringPreferencesKey("user_json")
    }

    val accessToken: Flow<String?> = context.sessionDataStore.data.map { it[Keys.ACCESS_TOKEN] }
    val refreshToken: Flow<String?> = context.sessionDataStore.data.map { it[Keys.REFRESH_TOKEN] }

    suspend fun currentAccessToken(): String? = accessToken.first()
    suspend fun currentRefreshToken(): String? = refreshToken.first()

    suspend fun saveSession(accessToken: String, refreshToken: String, userJson: String) {
        context.sessionDataStore.edit {
            it[Keys.ACCESS_TOKEN] = accessToken
            it[Keys.REFRESH_TOKEN] = refreshToken
            it[Keys.USER_JSON] = userJson
        }
    }

    suspend fun saveTokens(accessToken: String, refreshToken: String) {
        context.sessionDataStore.edit {
            it[Keys.ACCESS_TOKEN] = accessToken
            it[Keys.REFRESH_TOKEN] = refreshToken
        }
    }

    suspend fun clear() {
        context.sessionDataStore.edit { it.clear() }
    }
}
