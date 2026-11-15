package ir.salon.app.data.api

import ir.salon.core.model.Venue
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/** قرینهٔ /venues بک‌اند (فقط خواندنی‌های M1) */
interface VenueApi {

    @GET("venues/")
    suspend fun list(
        @Query("category") category: String? = null,
        @Query("search") search: String? = null,
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
    ): List<Venue>

    @GET("venues/{id}")
    suspend fun detail(@Path("id") id: Int): Venue
}
