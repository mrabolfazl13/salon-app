package ir.salon.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import dagger.hilt.android.AndroidEntryPoint
import ir.salon.app.ui.navigation.SalonNavGraph
import ir.salon.app.ui.session.SessionViewModel
import ir.salon.app.ui.theme.VazirmatnFamily
import ir.salon.core.designsystem.theme.SalonTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        // RTL اصلی اپ — فارسی
        window.decorView.layoutDirection = android.view.View.LAYOUT_DIRECTION_RTL

        setContent {
            SalonTheme(fontFamily = VazirmatnFamily) {
                val sessionViewModel: SessionViewModel = androidx.hilt.navigation.compose.hiltViewModel()
                SalonNavGraph(sessionViewModel = sessionViewModel)
            }
        }
    }
}
