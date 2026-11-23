package ir.salon.app.data.api

import ir.salon.core.model.Venue
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

// ─────────────────────────── بازی گروهی ───────────────────────────

@Serializable
data class GameDto(
    val id: Int,
    @SerialName("booking_id") val bookingId: Int = 0,
    @SerialName("organizer_id") val organizerId: Int = 0,
    val name: String,
    val description: String? = null,
    val sport: String = "football",
    val visibility: String = "public",
    @SerialName("max_players") val maxPlayers: Int = 0,
    @SerialName("skill_level") val skillLevel: String = "intermediate",
    @SerialName("payment_mode") val paymentMode: String = "split_payment",
    val status: String = "open",
    @SerialName("organizer_name") val organizerName: String? = null,
    @SerialName("current_players") val currentPlayers: Int = 0,
    @SerialName("venue_id") val venueId: Int? = null,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("venue_address") val venueAddress: String? = null,
    @SerialName("slot_date") val slotDate: String? = null,
    @SerialName("start_time") val startTime: String? = null,
    val duration: Int? = null,
    @SerialName("total_price") val totalPrice: Int? = null,
    @SerialName("price_per_player") val pricePerPlayer: Int? = null,
    @SerialName("my_participant_status") val myParticipantStatus: String? = null,
    @SerialName("my_role") val myRole: String? = null,
    @SerialName("result_set") val resultSet: Boolean = false,
    @SerialName("winner_ids") val winnerIds: List<Int>? = null,
)

@Serializable
data class GameListDto(
    val items: List<GameDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class GameActionDto(
    val game: GameDto? = null,
    val message: String = "",
)

@Serializable
data class CreateGameRequest(
    @SerialName("booking_id") val bookingId: Int,
    val name: String,
    val description: String? = null,
    val sport: String = "football",
    @SerialName("max_players") val maxPlayers: Int,
    @SerialName("skill_level") val skillLevel: String = "intermediate",
    val visibility: String = "public",
    @SerialName("payment_mode") val paymentMode: String = "split_payment",
)

@Serializable
data class GameParticipantDto(
    val id: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("full_name") val fullName: String? = null,
    val role: String = "member",
    val status: String = "accepted",
    @SerialName("payment_status") val paymentStatus: String? = null,
)

// ─────────────────────────── تیم ───────────────────────────

@Serializable
data class TeamDto(
    val id: Int,
    val name: String,
    val description: String? = null,
    val sport: String = "futsal",
    @SerialName("logo_url") val logoUrl: String? = null,
    val visibility: String = "private",
    @SerialName("captain_id") val captainId: Int = 0,
    @SerialName("captain_name") val captainName: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("member_count") val memberCount: Int = 0,
    val quota: Int = 0,
    @SerialName("is_official") val isOfficial: Boolean = false,
    @SerialName("my_role") val myRole: String? = null,
    @SerialName("my_status") val myStatus: String? = null,
    @SerialName("has_open_join_request") val hasOpenJoinRequest: Boolean = false,
)

@Serializable
data class TeamListDto(
    val items: List<TeamDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class CreateTeamRequest(
    val name: String,
    val description: String? = null,
    val sport: String = "futsal",
    val visibility: String = "private",
)

@Serializable
data class TeamMemberDto(
    val id: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("full_name") val fullName: String? = null,
    val phone: String? = null,
    val role: String = "member",
    val status: String = "accepted",
)

@Serializable
data class TeamMessageDto(
    val id: Int,
    @SerialName("user_id") val userId: Int,
    @SerialName("full_name") val fullName: String? = null,
    val content: String,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class TeamMessageListDto(
    val items: List<TeamMessageDto> = emptyList(),
    @SerialName("has_more") val hasMore: Boolean = false,
)

@Serializable
data class CreateTeamMessageRequest(val content: String)

@Serializable
data class JoinRequestBody(val message: String? = null)

@Serializable
data class JoinRequestResultDto(
    val id: Int = 0,
    val pending: Boolean = false,
    @SerialName("team_id") val teamId: Int = 0,
    val message: String = "",
)

@Serializable
data class RegisterTeamResultDto(
    @SerialName("participant_id") val participantId: Int = 0,
    @SerialName("team_id") val teamId: Int = 0,
    @SerialName("team_name") val teamName: String? = null,
    val seed: Int? = null,
    val status: String? = null,
)

// ─────────────────────────── تورنمنت ───────────────────────────

@Serializable
data class TournamentDto(
    val id: Int,
    val name: String,
    val description: String? = null,
    val sport: String = "futsal",
    @SerialName("organizer_id") val organizerId: Int = 0,
    @SerialName("organizer_name") val organizerName: String? = null,
    @SerialName("venue_id") val venueId: Int? = null,
    val status: String = "draft",
    val format: String = "single_elimination",
    @SerialName("starts_at") val startsAt: String? = null,
    @SerialName("entry_fee") val entryFee: Int = 0,
    @SerialName("team_count") val teamCount: Int = 0,
    @SerialName("winner_team_name") val winnerTeamName: String? = null,
)

@Serializable
data class TournamentListDto(
    val total: Int = 0,
    val items: List<TournamentDto> = emptyList(),
)

@Serializable
data class TournamentMatchDto(
    val id: Int,
    @SerialName("round_id") val roundId: Int = 0,
    val position: Int = 0,
    @SerialName("team_a_id") val teamAId: Int? = null,
    @SerialName("team_a_name") val teamAName: String? = null,
    @SerialName("team_b_id") val teamBId: Int? = null,
    @SerialName("team_b_name") val teamBName: String? = null,
    @SerialName("score_a") val scoreA: Int? = null,
    @SerialName("score_b") val scoreB: Int? = null,
    val status: String = "scheduled",
    @SerialName("winner_team_id") val winnerTeamId: Int? = null,
)

@Serializable
data class TournamentRoundDto(
    val id: Int,
    val number: Int = 0,
    val name: String = "",
    val bracket: String = "winners",
    val matches: List<TournamentMatchDto> = emptyList(),
    @SerialName("bye_team_id") val byeTeamId: Int? = null,
    @SerialName("bye_team_name") val byeTeamName: String? = null,
)

@Serializable
data class TournamentParticipantDto(
    @SerialName("team_id") val teamId: Int,
    @SerialName("team_name") val teamName: String? = null,
    val seed: Int? = null,
    val status: String = "registered",
)

@Serializable
data class BracketDto(
    val tournament: TournamentDto,
    val rounds: List<TournamentRoundDto> = emptyList(),
    val participants: List<TournamentParticipantDto> = emptyList(),
)

@Serializable
data class RegisterTeamRequest(
    @SerialName("team_id") val teamId: Int,
    val seed: Int? = null,
)

// ─────────────────────────── قرارداد ───────────────────────────

@Serializable
data class CreateContractRequest(
    @SerialName("venue_id") val venueId: Int,
    @SerialName("start_date") val startDate: String,
    @SerialName("end_date") val endDate: String,
    @SerialName("day_of_week") val dayOfWeek: Int,
    @SerialName("start_time") val startTime: String,
    val recurrence: String = "weekly",
    @SerialName("discounted_price") val discountedPrice: Int,
    val description: String? = null,
    @SerialName("auto_renew") val autoRenew: Boolean = false,
)

@Serializable
data class ContractDto(
    val id: Int,
    @SerialName("venue_id") val venueId: Int,
    @SerialName("user_id") val userId: Int = 0,
    @SerialName("start_date") val startDate: String,
    @SerialName("end_date") val endDate: String,
    @SerialName("day_of_week") val dayOfWeek: Int = 0,
    val days: List<Int> = emptyList(),
    @SerialName("start_time") val startTime: String = "",
    val duration: Int = 90,
    val recurrence: String = "weekly",
    @SerialName("original_price") val originalPrice: Int = 0,
    @SerialName("discounted_price") val discountedPrice: Int = 0,
    @SerialName("total_amount") val totalAmount: Int = 0,
    val status: String = "pending",
    @SerialName("payment_status") val paymentStatus: String = "unpaid",
    val description: String? = null,
    @SerialName("cancellation_policy") val cancellationPolicy: String? = null,
    @SerialName("reject_reason") val rejectReason: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("user_full_name") val userFullName: String? = null,
    val sessions: List<ContractSessionDto> = emptyList(),
    val payments: List<ContractPaymentDto> = emptyList(),
    val economics: ContractEconomicsDto? = null,
)

@Serializable
data class ContractSessionDto(
    val id: Int,
    @SerialName("slot_id") val slotId: Int = 0,
    @SerialName("session_date") val sessionDate: String,
    @SerialName("start_time") val startTime: String,
    val duration: Int = 90,
    val status: String = "scheduled",
    @SerialName("slot_status") val slotStatus: String = "reserved",
    @SerialName("is_past") val isPast: Boolean = false,
    @SerialName("cancel_requested") val cancelRequested: Boolean = false,
    @SerialName("cancellation_reason") val cancellationReason: String? = null,
)

@Serializable
data class ContractPaymentDto(
    val id: Int,
    val amount: Int,
    @SerialName("due_date") val dueDate: String,
    val label: String? = null,
    @SerialName("installment_no") val installmentNo: Int? = null,
    @SerialName("is_paid") val isPaid: Boolean = false,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("is_overdue") val isOverdue: Boolean = false,
    @SerialName("is_voided") val isVoided: Boolean = false,
    @SerialName("transaction_id") val transactionId: String? = null,
)

@Serializable
data class ContractEconomicsDto(
    @SerialName("total_sessions") val totalSessions: Int = 0,
    @SerialName("completed_sessions") val completedSessions: Int = 0,
    @SerialName("paid_amount") val paidAmount: Int = 0,
    @SerialName("remaining_amount") val remainingAmount: Int = 0,
    val overdue: Boolean = false,
)

// ─────────────────────────── مدیر سالن ───────────────────────────

@Serializable
data class CheckInResultDto(
    val success: Boolean = false,
    val message: String = "",
    @SerialName("booking_id") val bookingId: Int? = null,
    @SerialName("checked_in_at") val checkedInAt: String? = null,
)

@Serializable
data class ManagerContractRowDto(
    val contract: ContractDto,
    @SerialName("venue_name") val venueName: String = "",
    @SerialName("user_full_name") val userFullName: String? = null,
    @SerialName("user_phone") val userPhone: String? = null,
    @SerialName("outstanding_amount") val outstandingAmount: Int = 0,
    @SerialName("sessions_upcoming") val sessionsUpcoming: Int = 0,
    @SerialName("total_sessions") val totalSessions: Int = 0,
)

@Serializable
data class CrmCustomerDto(
    @SerialName("user_id") val userId: Int,
    @SerialName("full_name") val fullName: String? = null,
    val phone: String? = null,
    @SerialName("bookings_count") val bookingsCount: Int = 0,
    @SerialName("total_spend") val totalSpend: Int = 0,
    @SerialName("balance_due") val balanceDue: Int = 0,
    @SerialName("loyalty_balance") val loyaltyBalance: Int = 0,
    @SerialName("is_vip") val isVip: Boolean = false,
    val tags: List<String> = emptyList(),
    val segment: String? = null,
    @SerialName("last_booking_date") val lastBookingDate: String? = null,
    @SerialName("inactive_days") val inactiveDays: Int? = null,
)

@Serializable
data class CrmCustomersDto(
    val items: List<CrmCustomerDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class FinanceDashboardDto(
    @SerialName("today_revenue") val todayRevenue: Int = 0,
    @SerialName("month_revenue") val monthRevenue: Int = 0,
    @SerialName("today_received") val todayReceived: Int = 0,
    @SerialName("open_receivables") val openReceivables: Int = 0,
    @SerialName("active_contracts") val activeContracts: Int = 0,
    @SerialName("contracts_expiring_soon") val contractsExpiringSoon: Int = 0,
    @SerialName("bookings_today") val bookingsToday: Int = 0,
    @SerialName("occupancy_today") val occupancyToday: Double = 0.0,
    @SerialName("cancelled_bookings") val cancelledBookings: Int = 0,
    @SerialName("pending_payment_bookings") val pendingPaymentBookings: Int = 0,
    val expenses: Int = 0,
    @SerialName("gross_profit") val grossProfit: Int = 0,
    @SerialName("active_customers") val activeCustomers: Int = 0,
    @SerialName("active_teams") val activeTeams: Int = 0,
)

// ─────────────────────────── مدیر کل ───────────────────────────

@Serializable
data class AdminUsersStatsDto(
    @SerialName("total_users") val totalUsers: Int = 0,
    @SerialName("active_users") val activeUsers: Int = 0,
    @SerialName("verified_users") val verifiedUsers: Int = 0,
    @SerialName("by_role") val byRole: Map<String, Int> = emptyMap(),
)

@Serializable
data class AdminVenuesStatsDto(
    @SerialName("total_venues") val totalVenues: Int = 0,
    @SerialName("verified_venues") val verifiedVenues: Int = 0,
    @SerialName("pending_venues") val pendingVenues: Int = 0,
)

@Serializable
data class AdminUserDto(
    val id: Int,
    val phone: String,
    @SerialName("full_name") val fullName: String? = null,
    val role: String = "user",
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("is_verified") val isVerified: Boolean = false,
)

interface MoreApi {

    // بازی‌ها
    @GET("games/")
    suspend fun games(
        @Query("sport") sport: String? = null,
        @Query("availability_only") availabilityOnly: Boolean = false,
        @Query("limit") limit: Int = 30,
    ): GameListDto

    @GET("games/my")
    suspend fun myGames(): List<GameDto>

    @GET("games/{id}")
    suspend fun game(@Path("id") id: Int): GameDto

    @POST("games/")
    suspend fun createGame(@Body body: CreateGameRequest): GameDto

    @POST("games/{id}/join")
    suspend fun joinGame(@Path("id") id: Int): GameActionDto

    @POST("games/{id}/leave")
    suspend fun leaveGame(@Path("id") id: Int): GameActionDto

    @GET("games/{id}/participants")
    suspend fun gameParticipants(@Path("id") id: Int): List<GameParticipantDto>

    // تیم‌ها
    @GET("teams/")
    suspend fun myTeams(): List<TeamDto>

    @GET("teams/discover")
    suspend fun discoverTeams(
        @Query("search") search: String? = null,
        @Query("limit") limit: Int = 30,
        @Query("offset") offset: Int = 0,
    ): TeamListDto

    @GET("teams/{id}")
    suspend fun team(@Path("id") id: Int): TeamDto

    @POST("teams/")
    suspend fun createTeam(@Body body: CreateTeamRequest): TeamDto

    @GET("teams/{id}/members")
    suspend fun teamMembers(@Path("id") id: Int): List<TeamMemberDto>

    @POST("teams/{id}/join-request")
    suspend fun requestJoinTeam(@Path("id") id: Int, @Body body: JoinRequestBody = JoinRequestBody()): JoinRequestResultDto

    @POST("teams/{id}/leave")
    suspend fun leaveTeam(@Path("id") id: Int): Map<String, String>

    @GET("teams/{id}/messages")
    suspend fun teamMessages(@Path("id") id: Int): TeamMessageListDto

    @POST("teams/{id}/messages")
    suspend fun sendTeamMessage(@Path("id") id: Int, @Body body: CreateTeamMessageRequest): TeamMessageDto

    // تورنمنت‌ها
    @GET("tournaments")
    suspend fun tournaments(
        @Query("mine") mine: Boolean = false,
        @Query("limit") limit: Int = 50,
    ): TournamentListDto

    @GET("tournaments/{id}")
    suspend fun tournament(@Path("id") id: Int): TournamentDto

    @GET("tournaments/{id}/bracket")
    suspend fun bracket(@Path("id") id: Int): BracketDto

    @POST("tournaments/{id}/participants")
    suspend fun registerTeam(@Path("id") id: Int, @Body body: RegisterTeamRequest): RegisterTeamResultDto

    // قراردادها
    @GET("contracts/")
    suspend fun contracts(): List<ContractDto>

    @POST("contracts/")
    suspend fun createContract(@Body body: CreateContractRequest): ContractDto

    @GET("contracts/{id}")
    suspend fun contract(@Path("id") id: Int): ContractDto

    @POST("contracts/{id}/payments/{paymentId}/pay")
    suspend fun payContractInstallment(
        @Path("id") contractId: Int,
        @Path("paymentId") paymentId: Int,
        @Body body: Map<String, String> = emptyMap(),
    ): ContractPaymentDto

    @POST("contracts/{id}/cancel")
    suspend fun cancelContract(@Path("id") id: Int, @Body body: Map<String, String>): ContractDto

    @GET("contracts/manager/pending")
    suspend fun managerPendingContracts(): List<ManagerContractRowDto>

    @POST("contracts/{id}/approve")
    suspend fun approveContract(@Path("id") id: Int, @Body body: Map<String, String> = emptyMap()): ContractDto

    @POST("contracts/{id}/reject")
    suspend fun rejectContract(@Path("id") id: Int, @Body body: Map<String, String>): ContractDto

    // مدیر سالن
    @GET("venues/my-venues")
    suspend fun myVenues(): List<Venue>

    @GET("bookings/venue/{venueId}/pending")
    suspend fun venuePending(@Path("venueId") venueId: Int): List<PendingBookingDto>

    @POST("bookings/pending/{pendingId}/confirm")
    suspend fun confirmPending(@Path("pendingId") pendingId: String): BookingDto

    @POST("bookings/pending/{pendingId}/reject")
    suspend fun rejectPending(@Path("pendingId") pendingId: String): Map<String, String>

    @POST("checkin/verify")
    suspend fun verifyCheckIn(@Query("check_in_code") code: String): CheckInResultDto

    @GET("crm/customers")
    suspend fun crmCustomers(
        @Query("venue_id") venueId: Int,
        @Query("limit") limit: Int = 50,
    ): CrmCustomersDto

    @GET("finance/dashboard")
    suspend fun financeDashboard(@Query("venue_id") venueId: Int): FinanceDashboardDto

    // مدیر کل
    @GET("admin/stats/users")
    suspend fun adminUsersStats(): AdminUsersStatsDto

    @GET("admin/stats/venues")
    suspend fun adminVenuesStats(): AdminVenuesStatsDto

    @GET("admin/users")
    suspend fun adminUsers(@Query("limit") limit: Int = 50): List<AdminUserDto>

    @GET("admin/pending-venues")
    suspend fun pendingVenues(): List<Venue>

    @GET("admin/pending-managers")
    suspend fun pendingManagers(): List<AdminUserDto>

    @POST("admin/users/{userId}/approve")
    suspend fun approveUser(@Path("userId") userId: Int): Map<String, String>

    @POST("admin/users/{userId}/reject")
    suspend fun rejectUser(@Path("userId") userId: Int): Map<String, String>

    @POST("admin/verify-venue/{venueId}")
    suspend fun verifyVenue(@Path("venueId") venueId: Int): Map<String, String>
}
