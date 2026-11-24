package ir.salon.app.ui.theme

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.core.datastore.ThemeStore
import ir.salon.core.designsystem.theme.ThemeMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import javax.inject.Inject

/** کنترل تم سراسری — قرینهٔ themeStore وب؛ انتخاب کاربر ماندگار است */
@HiltViewModel
class ThemeViewModel @Inject constructor(
    private val themeStore: ThemeStore,
) : ViewModel() {

    private val _mode = MutableStateFlow(runBlocking { themeStore.modeOnce() })
    val mode: StateFlow<ThemeMode> = _mode

    fun setMode(value: ThemeMode) {
        _mode.value = value
        viewModelScope.launch { themeStore.setMode(value) }
    }

    /** سیستم → روشن → تیره → سیستم (قرینهٔ ThemeToggle وب) */
    fun cycle() {
        setMode(
            when (_mode.value) {
                ThemeMode.SYSTEM -> ThemeMode.LIGHT
                ThemeMode.LIGHT -> ThemeMode.DARK
                ThemeMode.DARK -> ThemeMode.SYSTEM
            },
        )
    }
}
