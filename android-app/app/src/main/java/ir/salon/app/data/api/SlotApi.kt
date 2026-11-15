package ir.salon.app.data.api

import ir.salon.core.model.Slot
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/** قرینهٔ /slots بک‌اند (خواندنی‌های جریان رزرو) */
interface SlotApi {

    @GET("slots/venue/{venueId}")
    suspend fun byVenue(
        @Path("venueId") venueId: Int,
        @Query("slot_date") slotDate: String? = null,
    ): List<Slot>

    @GET("slots/venue/{venueId}/range")
    suspend fun byRange(
        @Path("venueId") venueId: Int,
        @Query("start_date") startDate: String,
        @Query("end_date") endDate: String,
    ): List<Slot>
}
