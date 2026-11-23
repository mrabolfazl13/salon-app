package ir.salon.app.feature.venues

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ir.salon.core.common.PersianText
import ir.salon.core.designsystem.component.MinTouchTarget
import ir.salon.app.feature.bookings.faDate

/** علاقه‌مندی + نظرات کاربران — بخش M3 صفحهٔ جزئیات سالن */
@Composable
fun VenueSocialSection(
    viewModel: VenueSocialViewModel = hiltViewModel(),
    isAuthenticated: Boolean = false,
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showDialog by rememberSaveable { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "نظرات کاربران",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier
                    .weight(1f)
                    .semantics { heading() },
            )
            if (isAuthenticated) {
                IconButton(
                    onClick = viewModel::toggleFavorite,
                    enabled = !state.favoriteLoading,
                    modifier = Modifier.size(MinTouchTarget),
                ) {
                    Icon(
                        if (state.favorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        contentDescription = if (state.favorite) "حذف از علاقه‌مندی" else "افزودن به علاقه‌مندی",
                        tint = MaterialTheme.colorScheme.error,
                    )
                }
                OutlinedButton(
                    onClick = { showDialog = true },
                    modifier = Modifier.height(MinTouchTarget),
                ) { Text("ثبت نظر") }
            }
        }

        when {
            state.reviewsLoading -> Row(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                horizontalArrangement = Arrangement.Center,
            ) { CircularProgressIndicator(modifier = Modifier.size(24.dp)) }
            state.reviews.isEmpty() -> Text(
                "هنوز نظری ثبت نشده است.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            else -> state.reviews.take(5).forEach { review ->
                Card(modifier = Modifier.fillMaxWidth(), shape = MaterialTheme.shapes.medium) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                review.userName ?: "کاربر",
                                style = MaterialTheme.typography.labelLarge,
                                modifier = Modifier.weight(1f),
                            )
                            repeat(5) { index ->
                                Icon(
                                    if (index < review.rating) Icons.Filled.Star else Icons.Filled.StarBorder,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = androidx.compose.ui.graphics.Color(0xFFF59E0B),
                                )
                            }
                        }
                        review.comment?.takeIf { it.isNotBlank() }?.let {
                            Text(it, style = MaterialTheme.typography.bodySmall)
                        }
                        review.createdAt?.let {
                            Text(
                                faDate(it.take(10)),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }
        if (state.reviewsError != null) {
            Text(
                state.reviewsError!!.uiMessage(),
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }

    if (showDialog) {
        var rating by rememberSaveable { mutableIntStateOf(5) }
        var comment by rememberSaveable { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = {
                showDialog = false
                viewModel.dismissSubmitResult()
            },
            title = { Text("ثبت نظر") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row {
                        repeat(5) { index ->
                            IconButton(
                                onClick = { rating = index + 1 },
                                modifier = Modifier.size(MinTouchTarget),
                            ) {
                                Icon(
                                    if (index < rating) Icons.Filled.Star else Icons.Filled.StarBorder,
                                    contentDescription = "${index + 1} ستاره",
                                    tint = androidx.compose.ui.graphics.Color(0xFFF59E0B),
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = comment,
                        onValueChange = { comment = it },
                        label = { Text("نظر شما (اختیاری)") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    state.submitError?.let {
                        Text(it.uiMessage(), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                    if (state.submitted) {
                        Text("نظر شما ثبت شد", color = MaterialTheme.colorScheme.primary)
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.submitReview(rating, comment)
                        showDialog = false
                    },
                    enabled = !state.submitting,
                ) { Text(if (state.submitting) "در حال ارسال…" else "ارسال") }
            },
            dismissButton = {
                TextButton(onClick = {
                    showDialog = false
                    viewModel.dismissSubmitResult()
                }) { Text("انصراف") }
            },
        )
    }
}
