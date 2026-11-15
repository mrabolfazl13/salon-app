package ir.salon.app.data.repository

import ir.salon.app.data.api.VenueApi
import ir.salon.core.model.Venue
import javax.inject.Inject
import javax.inject.Singleton

interface VenueRepository {
    suspend fun list(category: String? = null, search: String? = null): List<Venue>
    suspend fun detail(id: Int): Venue
}

@Singleton
class VenueRepositoryImpl @Inject constructor(
    private val api: VenueApi,
) : VenueRepository {
    override suspend fun list(category: String?, search: String?): List<Venue> =
        api.list(category = category, search = search)

    override suspend fun detail(id: Int): Venue = api.detail(id)
}
