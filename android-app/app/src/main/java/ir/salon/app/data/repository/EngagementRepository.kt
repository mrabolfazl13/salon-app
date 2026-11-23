package ir.salon.app.data.repository

import ir.salon.app.data.api.ChangePasswordRequest
import ir.salon.app.data.api.CreatePaymentRequest
import ir.salon.app.data.api.CreateReviewRequest
import ir.salon.app.data.api.DealItemDto
import ir.salon.app.data.api.DealSubscriptionDto
import ir.salon.app.data.api.EngagementApi
import ir.salon.app.data.api.ForgotPasswordRequest
import ir.salon.app.data.api.LoyaltyDto
import ir.salon.app.data.api.MessageDto
import ir.salon.app.data.api.NotificationDto
import ir.salon.app.data.api.PaymentDto
import ir.salon.app.data.api.ResetPasswordRequest
import ir.salon.app.data.api.ReviewDto
import javax.inject.Inject
import javax.inject.Singleton

/** یک مرز برای قابلیت‌های کاربری M3 (اعلان/علاقه‌مندی/دیل/وفاداری/نظر/پرداخت) */
interface EngagementRepository {
    suspend fun notifications(unreadOnly: Boolean = false): List<NotificationDto>
    suspend fun unreadCount(): Int
    suspend fun markRead(id: Int)
    suspend fun markAllRead()
    suspend fun favoriteIds(): Set<Int>
    suspend fun setFavorite(venueId: Int, favorite: Boolean)
    suspend fun deals(): List<DealItemDto>
    suspend fun dealSubscription(): Boolean
    suspend fun setDealSubscription(enabled: Boolean): Boolean
    suspend fun loyalty(): LoyaltyDto
    suspend fun venueReviews(venueId: Int): List<ReviewDto>
    suspend fun createReview(venueId: Int, rating: Int, comment: String?): ReviewDto
    suspend fun createPayment(bookingId: Int): PaymentDto
    suspend fun pay(paymentId: Int): PaymentDto
    suspend fun myPayments(): List<PaymentDto>
    suspend fun changePassword(oldPassword: String, newPassword: String)
    suspend fun forgotPassword(phone: String): MessageDto
    suspend fun resetPassword(phone: String, code: String, newPassword: String)
}

@Singleton
class EngagementRepositoryImpl @Inject constructor(
    private val api: EngagementApi,
) : EngagementRepository {

    override suspend fun notifications(unreadOnly: Boolean): List<NotificationDto> =
        api.notifications(unreadOnly = unreadOnly)

    override suspend fun unreadCount(): Int = api.unreadCount().count

    override suspend fun markRead(id: Int) {
        api.markRead(id)
    }

    override suspend fun markAllRead() {
        api.markAllRead()
    }

    override suspend fun favoriteIds(): Set<Int> = api.favorites().venueIds.toSet()

    override suspend fun setFavorite(venueId: Int, favorite: Boolean) {
        if (favorite) api.addFavorite(venueId) else api.removeFavorite(venueId)
    }

    override suspend fun deals(): List<DealItemDto> = api.deals()

    override suspend fun dealSubscription(): Boolean = api.dealSubscription().notifyDeals

    override suspend fun setDealSubscription(enabled: Boolean): Boolean =
        api.setDealSubscription(enabled).notifyDeals

    override suspend fun loyalty(): LoyaltyDto = api.loyalty()

    override suspend fun venueReviews(venueId: Int): List<ReviewDto> = api.venueReviews(venueId)

    override suspend fun createReview(venueId: Int, rating: Int, comment: String?): ReviewDto =
        api.createReview(CreateReviewRequest(venueId, rating, comment?.trim()?.takeIf { it.isNotBlank() }))

    override suspend fun createPayment(bookingId: Int): PaymentDto =
        api.createPayment(CreatePaymentRequest(bookingId))

    override suspend fun pay(paymentId: Int): PaymentDto = api.pay(paymentId)

    override suspend fun myPayments(): List<PaymentDto> = api.myPayments()

    override suspend fun changePassword(oldPassword: String, newPassword: String) {
        api.changePassword(ChangePasswordRequest(oldPassword, newPassword))
    }

    override suspend fun forgotPassword(phone: String): MessageDto =
        api.forgotPassword(ForgotPasswordRequest(phone))

    override suspend fun resetPassword(phone: String, code: String, newPassword: String) {
        api.resetPassword(ResetPasswordRequest(phone, code, newPassword))
    }
}
