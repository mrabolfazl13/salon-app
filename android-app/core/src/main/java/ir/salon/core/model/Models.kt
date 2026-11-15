package ir.salon.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** نقش‌های کاربر — قرینهٔ UserRole بک‌اند */
enum class UserRole { USER, COACH, VENUE_MANAGER, CLUB_ADMIN, SUPER_ADMIN;

    companion object {
        fun from(raw: String?): UserRole = when (raw) {
            "coach" -> COACH
            "venue_manager" -> VENUE_MANAGER
            "club_admin" -> CLUB_ADMIN
            "super_admin" -> SUPER_ADMIN
            else -> USER
        }
    }
}

@Serializable
data class User(
    val id: Int,
    val phone: String,
    @SerialName("full_name") val fullName: String? = null,
    val role: String = "user",
    @SerialName("is_verified") val isVerified: Boolean = false,
    @SerialName("is_active") val isActive: Boolean = true,
)

@Serializable
data class AuthToken(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    val user: User? = null,
)

@Serializable
data class Venue(
    val id: Int,
    val name: String,
    val category: String = "futsal",
    val address: String,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val phone: String? = null,
    val description: String? = null,
    val amenities: List<String> = emptyList(),
    val images: List<String> = emptyList(),
    @SerialName("is_verified") val isVerified: Boolean = false,
    @SerialName("manager_id") val managerId: Int = 0,
    val price: Int = 0,
    @SerialName("default_slot_price") val defaultSlotPrice: Int? = null,
    @SerialName("average_rating") val averageRating: Double = 0.0,
    @SerialName("total_reviews") val totalReviews: Int = 0,
    @SerialName("payment_mode") val paymentMode: String? = null,
)

/** نگاشت DTO → دامنه: amenities/images ممکن است JSON رشته‌ای یا لیست باشند؛ سرور همیشه لیست می‌فرستد */
@Serializable
data class Slot(
    val id: Int,
    @SerialName("venue_id") val venueId: Int,
    @SerialName("slot_date") val slotDate: String,
    @SerialName("start_time") val startTime: String,
    val duration: Int = 90,
    @SerialName("base_price") val basePrice: Int = 0,
    @SerialName("current_price") val currentPrice: Int = 0,
    val status: String = "available",
    @SerialName("is_contract_slot") val isContractSlot: Boolean = false,
    @SerialName("is_deal") val isDeal: Boolean = false,
    @SerialName("deal_price") val dealPrice: Int? = null,
)
