package ir.salon.app.data.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

/** رزرو معلق (Redis) — id رشته‌ای */
@Serializable
data class PendingBookingDto(
    val id: String,
    @SerialName("slot_id") val slotId: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("payment_amount") val paymentAmount: Int,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("venue_phone") val venuePhone: String? = null,
    @SerialName("slot_date") val slotDate: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    val duration: Int? = null,
    @SerialName("pricing_breakdown") val pricingBreakdown: List<PricingStepDto> = emptyList(),
    @SerialName("coupon_code") val couponCode: String? = null,
    @SerialName("discount_amount") val discountAmount: Int = 0,
)

/** رزرو قطعی (DB) — id عددی */
@Serializable
data class BookingDto(
    val id: Int,
    @SerialName("slot_id") val slotId: Int,
    @SerialName("user_id") val userId: Int,
    val status: String,
    @SerialName("payment_amount") val paymentAmount: Int,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("venue_phone") val venuePhone: String? = null,
    @SerialName("venue_images") val venueImages: List<String> = emptyList(),
    @SerialName("slot_date") val slotDate: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    val duration: Int? = null,
    @SerialName("pricing_breakdown") val pricingBreakdown: List<PricingStepDto> = emptyList(),
    @SerialName("coupon_code") val couponCode: String? = null,
    @SerialName("discount_amount") val discountAmount: Int = 0,
    @SerialName("payment_mode") val paymentMode: String? = null,
    @SerialName("needs_receipt") val needsReceipt: Boolean = false,
    @SerialName("receipt_status") val receiptStatus: String = "none",
    val payment: PaymentDto? = null,
)

@Serializable
data class PricingStepDto(
    val step: String,
    val amount: Int,
    val label: String? = null,
)

@Serializable
data class CreateBookingRequest(
    @SerialName("slot_id") val slotId: Int,
    @SerialName("discount_code") val discountCode: String? = null,
    @SerialName("use_loyalty_points") val useLoyaltyPoints: Boolean = false,
)

interface BookingApi {

    @POST("bookings/")
    suspend fun create(@Body body: CreateBookingRequest): PendingBookingDto

    @GET("bookings/pending/my")
    suspend fun myPending(): List<PendingBookingDto>

    @DELETE("bookings/pending/{id}")
    suspend fun cancelPending(@Path("id") id: String): Map<String, String>

    @GET("bookings/")
    suspend fun myBookings(): List<BookingDto>

    @GET("bookings/{id}")
    suspend fun detail(@Path("id") id: Int): BookingDto

    @DELETE("bookings/{id}")
    suspend fun cancel(@Path("id") id: Int): Map<String, String>
}
