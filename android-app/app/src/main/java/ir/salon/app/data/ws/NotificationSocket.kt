package ir.salon.app.data.ws

import ir.salon.app.data.api.WsNotificationDto
import ir.salon.core.datastore.SessionStore
import ir.salon.core.network.CoreBuildConfig
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import javax.inject.Inject
import javax.inject.Singleton

/**
 * کانال بلادرنگ اعلان کاربر — قرینهٔ useWebSocket وب.
 * اتصال به /ws/user/{id}?token=... با تلاش دوبارهٔ ساده پس از قطعی.
 */
@Singleton
class NotificationSocket @Inject constructor(
    private val session: SessionStore,
    private val json: Json,
) {
    private val client = OkHttpClient.Builder().build()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _events = MutableSharedFlow<WsNotificationDto>(extraBufferCapacity = 32)
    val events: SharedFlow<WsNotificationDto> = _events

    private var socket: WebSocket? = null
    private var loopJob: Job? = null

    @Volatile
    private var active = false

    fun start(userId: Int) {
        if (active) return
        active = true
        loopJob = scope.launch {
            while (active) {
                runCatching { open(userId) }
                if (active) delay(RECONNECT_DELAY_MS)
            }
        }
    }

    fun stop() {
        active = false
        loopJob?.cancel()
        loopJob = null
        socket?.close(1000, "logout")
        socket = null
    }

    private suspend fun open(userId: Int): Boolean {
        val token = session.currentAccessToken() ?: return false
        val httpBase = CoreBuildConfig.WS_BASE_URL
            .replaceFirst("wss://", "https://")
            .replaceFirst("ws://", "http://")
            .trimEnd('/')
        val url = "$httpBase/user/$userId?token=$token"
        val request = Request.Builder().url(url).build()

        return try {
            val closed = CompletableDeferred<Unit>()
            val ws = client.newWebSocket(request, object : WebSocketListener() {
                override fun onMessage(webSocket: WebSocket, text: String) {
                    runCatching { json.decodeFromString<WsNotificationDto>(text) }
                        .getOrNull()
                        ?.takeIf { it.title.isNotBlank() }
                        ?.let { _events.tryEmit(it) }
                }

                override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                    socket = null
                    closed.complete(Unit)
                }

                override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                    socket = null
                    closed.complete(Unit)
                }
            })
            socket = ws
            // تا قطع‌شدن باز می‌ماند؛ حلقهٔ بیرونی بعد از آن دوباره تلاش می‌کند
            closed.await()
            true
        } catch (_: Exception) {
            false
        }
    }

    private companion object {
        const val RECONNECT_DELAY_MS = 5_000L
    }
}
