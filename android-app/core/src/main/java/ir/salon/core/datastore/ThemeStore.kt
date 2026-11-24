package ir.salon.core.datastore

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import ir.salon.core.designsystem.theme.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

/** ذخیرهٔ تنظیمات ظاهری کاربر — فعلاً حالت تم (سیستم/روشن/تیره) */
@Singleton
class ThemeStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val THEME_MODE = stringPreferencesKey("theme_mode")

    val mode: Flow<ThemeMode> = context.settingsDataStore.data.map { prefs ->
        when (prefs[THEME_MODE]) {
            "LIGHT" -> ThemeMode.LIGHT
            "DARK" -> ThemeMode.DARK
            else -> ThemeMode.SYSTEM
        }
    }

    suspend fun modeOnce(): ThemeMode = mode.first()

    suspend fun setMode(value: ThemeMode) {
        context.settingsDataStore.edit { it[THEME_MODE] = value.name }
    }
}
