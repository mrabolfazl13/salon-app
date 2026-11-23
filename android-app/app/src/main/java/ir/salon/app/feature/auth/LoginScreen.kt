package ir.salon.app.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.app.R
import ir.salon.core.designsystem.theme.LocalSalonExtra
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.graphics.Brush
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material3.Icon

import ir.salon.core.model.User

/** ورود — قرینهٔ pages/auth در وب؛ ارقام فارسی پذیرفته می‌شوند */
@Composable
fun LoginScreen(
    onLoggedIn: (User) -> Unit,
    onGoRegister: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    var phone by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(state) {
        val success = state as? AuthUiState.Success
        if (success != null) {
            onLoggedIn(success.user)
            viewModel.reset()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(horizontal = 24.dp, vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        // نشان گرادیانی برند
        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)
                .height(72.dp)
                .background(
                    Brush.horizontalGradient(LocalSalonExtra.current.gradientDeep),
                    RoundedCornerShape(36.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                Icons.Filled.PhoneAndroid,
                contentDescription = null,
                tint = androidx.compose.ui.graphics.Color.White,
            )
        }
        Spacer(Modifier.height(20.dp))
        Text(
            stringResource(R.string.login_title),
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.semantics { heading() },
        )
        Text(
            stringResource(R.string.login_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(28.dp))

        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text(stringResource(R.string.phone_label)) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier
                .fillMaxWidth()
                .height(MinTouchTarget + 24.dp),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text(stringResource(R.string.password_label)) },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier
                .fillMaxWidth()
                .height(MinTouchTarget + 24.dp),
        )

        when (val s = state) {
            is AuthUiState.Error -> {
                Spacer(Modifier.height(12.dp))
                Text(
                    s.error.uiMessage(),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            AuthUiState.Loading -> {
                Spacer(Modifier.height(16.dp))
                CircularProgressIndicator()
            }
            else -> Unit
        }

        Spacer(Modifier.height(24.dp))
        Button(
            onClick = { viewModel.login(ir.salon.core.common.PersianText.toLatinDigits(phone), password) {} },
            enabled = state !is AuthUiState.Loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
        ) {
            Text(stringResource(R.string.login_button), style = MaterialTheme.typography.titleMedium)
        }
        TextButton(onClick = onGoRegister, modifier = Modifier.height(MinTouchTarget)) {
            Text(stringResource(R.string.no_account_question))
        }
    }
}
