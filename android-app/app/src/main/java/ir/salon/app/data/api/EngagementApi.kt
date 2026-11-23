package ir.salon.app.data.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

// ─────────────────────────── اعلان‌ها ───────────────────────────

@Serializable
data class NotificationDto(
    val id: Int,
    val title: String,
    val message: String,
    val type: String = "info",
    @SerialName("notif_type") val notifType: String? = null,
    val data: JsonObject? = null,
    @SerialName("is_read") val isRead: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class UnreadCountDto(val count: Int = 0)

/** پیام WebSocket — پیش از ذخیره در DB ارسال می‌شود و id ندارد */
@Serializable
data class WsNotificationDto(
    val id: Int? = null,
    val type: String? = null,
    @SerialName("notif_type") val notifType: String? = null,
    val title: String = "",
    val message: String = "",
    val data: JsonObject? = null,
)

// ─────────────────────────── علاقه‌مندی‌ها ───────────────────────────

@Serializable
data class FavoriteIdsDto(@SerialName("venue_ids") val venueIds: List<Int> = emptyList())

// ─────────────────────────── دیل‌ها ───────────────────────────

@Serializable
data class DealItemDto(
    @SerialName("slot_id") val slotId: Int,
    @SerialName("venue_id") val venueId: Int,
    @SerialName("venue_name") val venueName: String,
    @SerialName("slot_date") val slotDate: String,
    @SerialName("start_time") val startTime: String,
    val duration: Int = 90,
    @SerialName("original_price") val originalPrice: Int = 0,
    @SerialName("deal_price") val dealPrice: Int = 0,
    val savings: Int = 0,
    @SerialName("discount_percent") val discountPercent: Int = 0,
    @SerialName("deal_expires_at") val dealExpiresAt: String? = null,
    @SerialName("distance_km") val distanceKm: Double? = null,
)

@Serializable
data class DealSubscriptionDto(@SerialName("notify_deals") val notifyDeals: Boolean = false)

// ─────────────────────────── امتیاز وفاداری ───────────────────────────

@Serializable
data class LoyaltyPointDto(
    val id: Int,
    val points: Int,
    val reason: String,
    @SerialName("source_type") val sourceType: String? = null,
    @SerialName("source_id") val sourceId: Int? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class LoyaltyDto(
    @SerialName("user_id") val userId: Int,
    val balance: Int = 0,
    @SerialName("point_value_rial") val pointValueRial: Int = 0,
    val history: List<LoyaltyPointDto> = emptyList(),
)

// ─────────────────────────── نظرات ───────────────────────────

@Serializable
data class ReviewDto(
    val id: Int,
    @SerialName("venue_id") val venueId: Int,
    @SerialName("user_id") val userId: Int,
    val rating: Int,
    val comment: String? = null,
    @SerialName("user_name") val userName: String? = null,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class CreateReviewRequest(
    @SerialName("venue_id") val venueId: Int,
    val rating: Int,
    val comment: String? = null,
)

// ─────────────────────────── پرداخت ───────────────────────────

@Serializable
data class PaymentDto(
    val id: Int,
    @SerialName("booking_id") val bookingId: Int,
    @SerialName("user_id") val userId: Int,
    val amount: Int,
    val status: String,
    val gateway: String = "mock",
    val authority: String? = null,
    @SerialName("transaction_id") val transactionId: String? = null,
    @SerialName("card_pan") val cardPan: String? = null,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("payment_url") val paymentUrl: String? = null,
)

@Serializable
data class CreatePaymentRequest(@SerialName("booking_id") val bookingId: Int)

// ─────────────────────────── حساب کاربری ───────────────────────────

@Serializable
data class ChangePasswordRequest(
    @SerialName("old_password") val oldPassword: String,
    @SerialName("new_password") val newPassword: String,
)

@Serializable
data class ForgotPasswordRequest(val phone: String)

@Serializable
data class ResetPasswordRequest(
    val phone: String,
    val code: String,
    @SerialName("new_password") val newPassword: String,
)

@Serializable
data class MessageDto(
    val message: String = "",
    @SerialName("dev_code") val devCode: String? = null,
)

interface EngagementApi {

    // اعلان‌ها
    @GET("notifications/")
    suspend fun notifications(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
        @Query("unread_only") unreadOnly: Boolean = false,
    ): List<NotificationDto>

    @GET("notifications/unread-count")
    suspend fun unreadCount(): UnreadCountDto

    @PUT("notifications/{id}/read")
    suspend fun markRead(@Path("id") id: Int): NotificationDto

    @PUT("notifications/read-all")
    suspend fun markAllRead(): UnreadCountDto

    // علاقه‌مندی‌ها
    @GET("favorites")
    suspend fun favorites(): FavoriteIdsDto

    @POST("favorites/{venueId}")
    suspend fun addFavorite(@Path("venueId") venueId: Int): Map<String, Boolean>

    @DELETE("favorites/{venueId}")
    suspend fun removeFavorite(@Path("venueId") venueId: Int): Map<String, Boolean>

    // دیل‌ها
    @GET("deals/available")
    suspend fun deals(
        @Query("sort") sort: String = "time",
        @Query("limit") limit: Int = 50,
    ): List<DealItemDto>

    @GET("deals/subscription")
    suspend fun dealSubscription(): DealSubscriptionDto

    @PUT("deals/subscription")
    suspend fun setDealSubscription(@Query("enabled") enabled: Boolean): DealSubscriptionDto

    // وفاداری
    @GET("loyalty/me")
    suspend fun loyalty(@Query("limit") limit: Int = 50): LoyaltyDto

    // نظرات
    @GET("reviews/venue/{venueId}")
    suspend fun venueReviews(@Path("venueId") venueId: Int): List<ReviewDto>

    @POST("reviews/")
    suspend fun createReview(@Body body: CreateReviewRequest): ReviewDto

    // پرداخت
    @POST("payments/")
    suspend fun createPayment(@Body body: CreatePaymentRequest): PaymentDto

    @POST("payments/{id}/pay")
    suspend fun pay(@Path("id") id: Int): PaymentDto

    @GET("payments/my")
    suspend fun myPayments(): List<PaymentDto>

    // حساب
    @POST("auth/change-password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): MessageDto

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): MessageDto

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: ResetPasswordRequest): MessageDto
}
