package ir.salon.app.feature.venues

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import ir.salon.app.data.api.ReviewDto
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.core.common.AppError
import ir.salon.core.common.AppErrorMapper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VenueSocialState(
    val favorite: Boolean = false,
    val favoriteLoading: Boolean = true,
    val reviews: List<ReviewDto> = emptyList(),
    val reviewsLoading: Boolean = true,
    val reviewsError: AppError? = null,
    val submitting: Boolean = false,
    val submitError: AppError? = null,
    val submitted: Boolean = false,
)

/** علاقه‌مندی + نظرات سالن — بخش اجتماعی صفحهٔ جزئیات (M3) */
@HiltViewModel
class VenueSocialViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val engagementRepository: EngagementRepository,
) : ViewModel() {

    private val venueId: Int = checkNotNull(savedStateHandle["venueId"])

    private val _state = MutableStateFlow(VenueSocialState())
    val state: StateFlow<VenueSocialState> = _state

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            runCatching { engagementRepository.favoriteIds() }
                .onSuccess { _state.value = _state.value.copy(favorite = venueId in it, favoriteLoading = false) }
                .onFailure { _state.value = _state.value.copy(favoriteLoading = false) }

            runCatching { engagementRepository.venueReviews(venueId) }
                .onSuccess {
                    _state.value = _state.value.copy(
                        reviews = it,
                        reviewsLoading = false,
                        reviewsError = null,
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        reviewsLoading = false,
                        reviewsError = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun toggleFavorite() {
        val next = !_state.value.favorite
        _state.value = _state.value.copy(favorite = next, favoriteLoading = true)
        viewModelScope.launch {
            runCatching { engagementRepository.setFavorite(venueId, next) }
                .onSuccess { _state.value = _state.value.copy(favoriteLoading = false) }
                .onFailure {
                    _state.value = _state.value.copy(
                        favorite = !next,
                        favoriteLoading = false,
                        reviewsError = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun submitReview(rating: Int, comment: String?) {
        if (rating !in 1..5) return
        _state.value = _state.value.copy(submitting = true, submitError = null)
        viewModelScope.launch {
            runCatching { engagementRepository.createReview(venueId, rating, comment) }
                .onSuccess {
                    _state.value = _state.value.copy(submitting = false, submitted = true)
                    load()
                }
                .onFailure {
                    _state.value = _state.value.copy(
                        submitting = false,
                        submitError = AppErrorMapper.from(it),
                    )
                }
        }
    }

    fun dismissSubmitResult() {
        _state.value = _state.value.copy(submitted = false, submitError = null)
    }
}
