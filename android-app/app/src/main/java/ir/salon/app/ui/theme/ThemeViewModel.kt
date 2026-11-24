package ir.salon.app.ui.theme

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.core.datastore.ThemeStore
import ir.salon.core.designsystem.theme.ThemeMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** کنترل تم سراسری — قرینهٔ themeStore وب؛ انتخاب کاربر ماندگار است */
@HiltViewModel
class ThemeViewModel @Inject constructor(
    private val themeStore: ThemeStore,
) : ViewModel() {

    private val _mode = MutableStateFlow(ThemeMode.SYSTEM)
    val mode: StateFlow<ThemeMode> = _mode

    init {
        // بارگذاری غیرهمزمان انتخاب ذخیره‌شده — بدون مسدودسازی ترید اصلی
        viewModelScope.launch {
            _mode.value = themeStore.modeOnce()
        }
    }

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
