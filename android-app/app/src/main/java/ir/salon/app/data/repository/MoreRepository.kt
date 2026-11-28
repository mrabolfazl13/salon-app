package ir.salon.app.data.repository

import ir.salon.app.data.api.AdminUserDto
import ir.salon.app.data.api.AdminUsersStatsDto
import ir.salon.app.data.api.AdminVenuesStatsDto
import ir.salon.app.data.api.BookingDto
import ir.salon.app.data.api.BracketDto
import ir.salon.app.data.api.CheckInResultDto
import ir.salon.app.data.api.ContractDto
import ir.salon.app.data.api.ContractPaymentDto
import ir.salon.app.data.api.CrmCustomerDto
import ir.salon.app.data.api.FinanceDashboardDto
import ir.salon.app.data.api.ManagerContractRowDto
import ir.salon.app.data.api.CreateGameRequest
import ir.salon.app.data.api.CreateContractRequest
import ir.salon.app.data.api.CreateTeamMessageRequest
import ir.salon.app.data.api.CreateTeamRequest
import ir.salon.app.data.api.GameActionDto
import ir.salon.app.data.api.GameDto
import ir.salon.app.data.api.GameParticipantDto
import ir.salon.app.data.api.JoinRequestBody
import ir.salon.app.data.api.MoreApi
import ir.salon.app.data.api.PendingBookingDto
import ir.salon.app.data.api.RegisterTeamRequest
import ir.salon.app.data.api.TeamDto
import ir.salon.app.data.api.TeamMemberDto
import ir.salon.app.data.api.TeamMessageDto
import ir.salon.app.data.api.TournamentDto
import ir.salon.core.model.Venue
import javax.inject.Inject
import javax.inject.Singleton

/** قابلیت‌های گروهی/تیمی/قرارداد/مدیریتی — M4 و M5 */
interface MoreRepository {
    // بازی
    suspend fun games(): List<GameDto>
    suspend fun myGames(): List<GameDto>
    suspend fun game(id: Int): GameDto
    suspend fun createGame(body: CreateGameRequest): GameDto
    suspend fun joinGame(id: Int): GameActionDto
    suspend fun leaveGame(id: Int): GameActionDto
    suspend fun gameParticipants(id: Int): List<GameParticipantDto>

    // تیم
    suspend fun myTeams(): List<TeamDto>
    suspend fun discoverTeams(search: String? = null): List<TeamDto>
    suspend fun team(id: Int): TeamDto
    suspend fun createTeam(body: CreateTeamRequest): TeamDto
    suspend fun teamMembers(id: Int): List<TeamMemberDto>
    suspend fun requestJoinTeam(id: Int): String
    suspend fun leaveTeam(id: Int)
    suspend fun teamMessages(id: Int): List<TeamMessageDto>
    suspend fun sendTeamMessage(id: Int, content: String): TeamMessageDto

    // تورنمنت
    suspend fun tournaments(mine: Boolean = false): List<TournamentDto>
    suspend fun tournament(id: Int): TournamentDto
    suspend fun bracket(id: Int): BracketDto
    suspend fun registerTeam(tournamentId: Int, teamId: Int, seed: Int? = null): String

    // قرارداد
    suspend fun contracts(): List<ContractDto>
    suspend fun createContract(body: CreateContractRequest): ContractDto
    suspend fun contract(id: Int): ContractDto
    suspend fun payContractInstallment(contractId: Int, paymentId: Int): ContractPaymentDto
    suspend fun cancelContract(id: Int, reason: String)
    suspend fun managerPendingContracts(): List<ManagerContractRowDto>
    suspend fun approveContract(id: Int)
    suspend fun rejectContract(id: Int, reason: String)

    // CRM / مالی
    suspend fun crmCustomers(venueId: Int): List<CrmCustomerDto>
    suspend fun financeDashboard(venueId: Int): FinanceDashboardDto

    // ایتا
    suspend fun eitaaChannel(venueId: Int): ir.salon.app.data.api.EitaaChannelDto? =
        runCatching { api.eitaaChannel(venueId) }.getOrNull()

    suspend fun upsertEitaaChannel(
        venueId: Int,
        chatId: String,
        botToken: String?,
        isActive: Boolean,
        pinUpdates: Boolean,
    ): ir.salon.app.data.api.EitaaChannelDto =
        api.upsertEitaaChannel(
            venueId,
            ir.salon.app.data.api.EitaaChannelUpsertRequest(
                chat_id = chatId,
                bot_token = botToken?.trim()?.takeIf { it.isNotBlank() },
                is_active = isActive,
                pin_updates = pinUpdates,
            ),
        )

    suspend fun deleteEitaaChannel(venueId: Int): Unit = api.deleteEitaaChannel(venueId)

    suspend fun postEitaaNow(venueId: Int): String {
        val r = api.postEitaaNow(venueId)
        return r["detail"] ?: r["message"] ?: "ارسال شد"
    }

    // مدیر سالن — سانس‌ها
    suspend fun slotsByDate(venueId: Int, slotDate: String): List<ir.salon.core.model.Slot>
    suspend fun generateSlots(venueId: Int, slotDate: String): String
    suspend fun setSlotBlocked(slotId: Int, blocked: Boolean)

    // مدیر سالن
    suspend fun myVenues(): List<Venue>
    suspend fun venuePending(venueId: Int): List<PendingBookingDto>
    suspend fun confirmPending(id: String): BookingDto
    suspend fun rejectPending(id: String)
    suspend fun verifyCheckIn(code: String): CheckInResultDto

    // مدیر کل
    suspend fun adminUsersStats(): AdminUsersStatsDto
    suspend fun adminVenuesStats(): AdminVenuesStatsDto
    suspend fun adminUsers(): List<AdminUserDto>
    suspend fun pendingVenues(): List<Venue>
    suspend fun pendingManagers(): List<AdminUserDto>
    suspend fun approveUser(id: Int)
    suspend fun rejectUser(id: Int)
    suspend fun verifyVenue(id: Int)
}

@Singleton
class MoreRepositoryImpl @Inject constructor(
    private val api: MoreApi,
) : MoreRepository {

    override suspend fun games(): List<GameDto> = api.games().items
    override suspend fun myGames(): List<GameDto> = api.myGames()
    override suspend fun game(id: Int): GameDto = api.game(id)
    override suspend fun createGame(body: CreateGameRequest): GameDto = api.createGame(body)
    override suspend fun joinGame(id: Int): GameActionDto = api.joinGame(id)
    override suspend fun leaveGame(id: Int): GameActionDto = api.leaveGame(id)
    override suspend fun gameParticipants(id: Int): List<GameParticipantDto> = api.gameParticipants(id)

    override suspend fun myTeams(): List<TeamDto> = api.myTeams()
    override suspend fun discoverTeams(search: String?): List<TeamDto> =
        api.discoverTeams(search?.trim()?.takeIf { it.isNotBlank() }).items

    override suspend fun team(id: Int): TeamDto = api.team(id)
    override suspend fun createTeam(body: CreateTeamRequest): TeamDto = api.createTeam(body)
    override suspend fun teamMembers(id: Int): List<TeamMemberDto> = api.teamMembers(id)
    override suspend fun requestJoinTeam(id: Int): String =
        api.requestJoinTeam(id, JoinRequestBody()).message.ifBlank { "درخواست عضویت ثبت شد" }

    override suspend fun leaveTeam(id: Int) {
        api.leaveTeam(id)
    }

    override suspend fun teamMessages(id: Int): List<TeamMessageDto> = api.teamMessages(id).items
    override suspend fun sendTeamMessage(id: Int, content: String): TeamMessageDto =
        api.sendTeamMessage(id, CreateTeamMessageRequest(content))

    override suspend fun tournaments(mine: Boolean): List<TournamentDto> =
        api.tournaments(mine = mine).items

    override suspend fun tournament(id: Int): TournamentDto = api.tournament(id)
    override suspend fun bracket(id: Int): BracketDto = api.bracket(id)
    override suspend fun registerTeam(tournamentId: Int, teamId: Int, seed: Int?): String {
        val result = api.registerTeam(tournamentId, RegisterTeamRequest(teamId, seed))
        return "تیم ${result.teamName ?: ""} ثبت شد".trim()
    }

    override suspend fun contracts(): List<ContractDto> = api.contracts()
    override suspend fun createContract(body: CreateContractRequest): ContractDto = api.createContract(body)
    override suspend fun contract(id: Int): ContractDto = api.contract(id)
    override suspend fun payContractInstallment(contractId: Int, paymentId: Int): ContractPaymentDto =
        api.payContractInstallment(contractId, paymentId, emptyMap())

    override suspend fun cancelContract(id: Int, reason: String) {
        api.cancelContract(id, mapOf("reason" to reason))
    }

    override suspend fun managerPendingContracts(): List<ManagerContractRowDto> =
        api.managerPendingContracts()

    override suspend fun approveContract(id: Int) {
        api.approveContract(id)
    }

    override suspend fun rejectContract(id: Int, reason: String) {
        api.rejectContract(id, mapOf("reason" to reason))
    }

    override suspend fun crmCustomers(venueId: Int): List<CrmCustomerDto> =
        api.crmCustomers(venueId).items

    override suspend fun financeDashboard(venueId: Int): FinanceDashboardDto =
        api.financeDashboard(venueId)

    override suspend fun slotsByDate(venueId: Int, slotDate: String): List<ir.salon.core.model.Slot> =
        api.slotsByDate(venueId, slotDate)

    override suspend fun generateSlots(venueId: Int, slotDate: String): String =
        api.generateSlots(venueId, slotDate)["message"] ?: "سانس‌ها ساخته شد"

    override suspend fun setSlotBlocked(slotId: Int, blocked: Boolean) {
        if (blocked) api.blockSlot(slotId) else api.unblockSlot(slotId)
    }

    override suspend fun myVenues(): List<Venue> = api.myVenues()
    override suspend fun venuePending(venueId: Int): List<PendingBookingDto> = api.venuePending(venueId)
    override suspend fun confirmPending(id: String): BookingDto = api.confirmPending(id)
    override suspend fun rejectPending(id: String) {
        api.rejectPending(id)
    }

    override suspend fun verifyCheckIn(code: String): CheckInResultDto = api.verifyCheckIn(code)

    override suspend fun adminUsersStats(): AdminUsersStatsDto = api.adminUsersStats()
    override suspend fun adminVenuesStats(): AdminVenuesStatsDto = api.adminVenuesStats()
    override suspend fun adminUsers(): List<AdminUserDto> = api.adminUsers()
    override suspend fun pendingVenues(): List<Venue> = api.pendingVenues()

    override suspend fun pendingManagers(): List<AdminUserDto> = api.pendingManagers()

    override suspend fun approveUser(id: Int) {
        api.approveUser(id)
    }

    override suspend fun rejectUser(id: Int) {
        api.rejectUser(id)
    }

    override suspend fun verifyVenue(id: Int) {
        api.verifyVenue(id)
    }
}
