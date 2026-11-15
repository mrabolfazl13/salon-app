package ir.salon.app.data.repository

import ir.salon.app.data.api.BookingApi
import ir.salon.app.data.api.BookingDto
import ir.salon.app.data.api.CreateBookingRequest
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.data.api.SlotApi
import ir.salon.core.model.Slot
import javax.inject.Inject
import javax.inject.Singleton

interface SlotRepository {
    suspend fun range(venueId: Int, startDate: String, endDate: String): List<Slot>
}

interface BookingRepository {
    suspend fun create(slotId: Int, discountCode: String?, useLoyaltyPoints: Boolean): PendingBookingDto
    suspend fun myPending(): List<PendingBookingDto>
    suspend fun myBookings(): List<BookingDto>
    suspend fun detail(id: Int): BookingDto
    suspend fun cancelBooking(id: Int)
    suspend fun cancelPending(id: String)
}

@Singleton
class SlotRepositoryImpl @Inject constructor(
    private val api: SlotApi,
) : SlotRepository {
    override suspend fun range(venueId: Int, startDate: String, endDate: String): List<Slot> =
        api.byRange(venueId, startDate, endDate)
}

@Singleton
class BookingRepositoryImpl @Inject constructor(
    private val api: BookingApi,
) : BookingRepository {
    override suspend fun create(slotId: Int, discountCode: String?, useLoyaltyPoints: Boolean): PendingBookingDto =
        api.create(CreateBookingRequest(slotId, discountCode?.trim()?.takeIf { it.isNotBlank() }, useLoyaltyPoints))

    override suspend fun myPending(): List<PendingBookingDto> = api.myPending()

    override suspend fun myBookings(): List<BookingDto> = api.myBookings()

    override suspend fun detail(id: Int): BookingDto = api.detail(id)

    override suspend fun cancelBooking(id: Int) {
        api.cancel(id)
    }

    override suspend fun cancelPending(id: String) {
        api.cancelPending(id)
    }
}
