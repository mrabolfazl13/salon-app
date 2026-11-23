package ir.salon.app.feature.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocalOffer
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.app.R
import ir.salon.app.feature.bookings.faDate
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.core.designsystem.component.SkeletonScreen
import ir.salon.core.designsystem.theme.LocalSalonExtra
import ir.salon.core.model.User
import ir.salon.core.model.UserRole

private val roleLabels = mapOf(
    "user" to "کاربر",
    "coach" to "مربی",
    "venue_manager" to "مدیر سالن",
    "club_admin" to "مدیر باشگاه",
    "super_admin" to "مدیر کل",
)

@Composable
fun ProfileScreen(
    onBack: () -> Unit,
    onOpenFavorites: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenDeals: () -> Unit,
    onOpenBookings: () -> Unit,
    onOpenMore: () -> Unit,
    onLoggedOut: () -> Unit,
    onUserUpdated: (User) -> Unit,
    sessionViewModel: ir.salon.app.ui.session.SessionViewModel,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showPassword by rememberSaveable { mutableStateOf(false) }
    var showLogout by rememberSaveable { mutableStateOf(false) }
    var oldPassword by rememberSaveable { mutableStateOf("") }
    var newPassword by rememberSaveable { mutableStateOf("") }
    var confirmPassword by rememberSaveable { mutableStateOf("") }
    var resetPhone by rememberSaveable { mutableStateOf("") }
    var resetCode by rememberSaveable { mutableStateOf("") }
    var newResetPassword by rememberSaveable { mutableStateOf("") }
    var showReset by rememberSaveable { mutableStateOf(false) }
    val snackbar = remember { androidx.compose.material3.SnackbarHostState() }
    val extra = LocalSalonExtra.current

    LaunchedEffect(state.toast) {
        state.toast?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeToast()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack, modifier = Modifier.size(MinTouchTarget)) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = stringResource(R.string.cd_back))
                }
                Text(
                    stringResource(R.string.nav_profile),
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.semantics { heading() },
                )
            }

            when {
                state.loading -> SkeletonScreen(rows = 5)
                state.user == null -> ir.salon.core.designsystem.component.ErrorState(
                    message = state.error?.uiMessage() ?: "اطلاعات حساب دریافت نشد",
                    onRetry = viewModel::load,
                )
                else -> {
                    val user = state.user!!
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        HeaderCard(user = user, extraColors = extra)

                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                Text("ویرایش پروفایل", style = MaterialTheme.typography.titleMedium)
                                OutlinedTextField(
                                    value = state.fullName,
                                    onValueChange = viewModel::onNameChange,
                                    label = { Text(stringResource(R.string.full_name_label)) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                )
                                Button(
                                    onClick = {
                                        viewModel.saveProfile { updated ->
                                            sessionViewModel.updateUser(updated)
                                            onUserUpdated(updated)
                                        }
                                    },
                                    enabled = !state.savingProfile,
                                    modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
                                ) {
                                    Text(if (state.savingProfile) "در حال ذخیره…" else "ذخیره تغییرات")
                                }
                            }
                        }

                        LoyaltyCard(balance = state.loyalty?.balance ?: 0, historyCount = state.loyalty?.history?.size ?: 0)

                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.LocalOffer, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(Modifier.width(8.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("اعلان سانس‌های لحظه آخری", style = MaterialTheme.typography.titleSmall)
                                        Text(
                                            "فقط برای سالن‌های موردعلاقه",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    Switch(
                                        checked = state.dealSubscription,
                                        onCheckedChange = viewModel::setDealSubscription,
                                        enabled = !state.updatingSubscription,
                                    )
                                }
                            }
                        }

                        Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                QuickLink("رزروهای من", Icons.Filled.CalendarMonth, onOpenBookings)
                                HorizontalDivider()
                                QuickLink("سالن‌های موردعلاقه (${PersianText.toPersianDigits(state.favoriteCount.toString())})", Icons.Filled.Favorite, onOpenFavorites)
                                HorizontalDivider()
                                QuickLink("اعلان‌ها", Icons.Filled.Notifications, onOpenNotifications)
                                HorizontalDivider()
                                QuickLink("دیل‌های لحظه آخری", Icons.Filled.LocalOffer, onOpenDeals)
                                HorizontalDivider()
                                QuickLink("بیشتر / امکانات", Icons.Filled.Star, onOpenMore)
                            }
                        }

                        TextButton(onClick = { showPassword = !showPassword }) {
                            Text(if (showPassword) "بستن تغییر رمز" else "تغییر رمز عبور")
                        }
                        if (showPassword) {
                            Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    OutlinedTextField(
                                        value = oldPassword,
                                        onValueChange = { oldPassword = it },
                                        label = { Text("رمز فعلی") },
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    OutlinedTextField(
                                        value = newPassword,
                                        onValueChange = { newPassword = it },
                                        label = { Text("رمز جدید") },
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    OutlinedTextField(
                                        value = confirmPassword,
                                        onValueChange = { confirmPassword = it },
                                        label = { Text("تکرار رمز جدید") },
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    Button(
                                        onClick = {
                                            viewModel.changePassword(oldPassword, newPassword, confirmPassword)
                                            oldPassword = ""
                                            newPassword = ""
                                            confirmPassword = ""
                                        },
                                        enabled = !state.savingPassword,
                                        modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
                                    ) {
                                        Text(if (state.savingPassword) "در حال تغییر…" else "تغییر رمز")
                                    }
                                }
                            }
                        }

                        TextButton(onClick = { showReset = !showReset }) {
                            Text(if (showReset) "بستن بازیابی رمز" else "فراموشی رمز عبور")
                        }
                        if (showReset) {
                            Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    OutlinedTextField(
                                        value = resetPhone,
                                        onValueChange = { resetPhone = it },
                                        label = { Text(stringResource(R.string.phone_label)) },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    OutlinedButton(
                                        onClick = { viewModel.requestReset(resetPhone) },
                                        enabled = !state.creatingReset,
                                        modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
                                    ) { Text("ارسال کد بازیابی") }
                                    state.resetMessage?.let {
                                        Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                                    }
                                    OutlinedTextField(
                                        value = resetCode,
                                        onValueChange = { resetCode = it },
                                        label = { Text("کد بازیابی") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    OutlinedTextField(
                                        value = newResetPassword,
                                        onValueChange = { newResetPassword = it },
                                        label = { Text("رمز جدید") },
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    Button(
                                        onClick = {
                                            viewModel.resetPassword(resetPhone, resetCode, newResetPassword)
                                            resetCode = ""
                                            newResetPassword = ""
                                        },
                                        enabled = !state.creatingReset,
                                        modifier = Modifier.fillMaxWidth().height(MinTouchTarget),
                                    ) { Text("بازنشانی رمز") }
                                }
                            }
                        }

                        if (state.error != null) {
                            Text(
                                state.error!!.uiMessage(),
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }

                        OutlinedButton(
                            onClick = { showLogout = true },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            Text("خروج از حساب", color = MaterialTheme.colorScheme.error)
                        }
                        Spacer(Modifier.height(24.dp))
                    }
                }
            }
        }

        androidx.compose.material3.SnackbarHost(
            hostState = snackbar,
            modifier = Modifier.align(Alignment.BottomCenter),
        )
    }

    if (showLogout) {
        AlertDialog(
            onDismissRequest = { showLogout = false },
            title = { Text("خروج از حساب") },
            text = { Text("از حساب خود خارج می‌شوید؟") },
            confirmButton = {
                TextButton(onClick = {
                    showLogout = false
                    sessionViewModel.logout(onLoggedOut)
                }) { Text("خروج") }
            },
            dismissButton = {
                TextButton(onClick = { showLogout = false }) { Text("انصراف") }
            },
        )
    }
}

@Composable
private fun HeaderCard(user: User, extraColors: ir.salon.core.designsystem.theme.SalonExtraColors) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(32.dp))
                    .background(Brush.linearGradient(extraColors.gradientEnergy)),
                contentAlignment = Alignment.Center,
            ) {
                val initial = (user.fullName ?: "؟").trim().take(1)
                Text(initial, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onPrimary)
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    user.fullName ?: "کاربر",
                    style = MaterialTheme.typography.titleLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    PersianText.toPersianDigits(user.phone),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    roleLabels[user.role] ?: "کاربر",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
private fun LoyaltyCard(balance: Int, historyCount: Int) {
    Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.large) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.Star, contentDescription = null, tint = androidx.compose.ui.graphics.Color(0xFFF59E0B))
            Spacer(Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("امتیاز وفاداری", style = MaterialTheme.typography.titleSmall)
                Text(
                    "${PersianText.toPersianDigits(balance.toString())} امتیاز",
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            Text(
                "${PersianText.toPersianDigits(historyCount.toString())} رویداد",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun QuickLink(label: String, icon: ImageVector, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(MinTouchTarget)
            .padding(horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        androidx.compose.material3.TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(10.dp))
            Text(label, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
            Text("›", style = MaterialTheme.typography.titleMedium)
        }
    }
}
