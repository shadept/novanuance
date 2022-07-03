import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import java.security.MessageDigest
import java.util.*

class UUIDBuilder {
    private val hasher = MessageDigest.getInstance("sha-1")

    fun append(value: Int) {
        hasher.update(value.toByte())
    }

    fun append(value: String) {
        hasher.update(value.toByteArray())
    }

    fun append(date: LocalDate) {
        // There is probably a better way of doing this
        hasher.update(date.toString().toByteArray())
    }

    fun append(date: LocalDateTime) {
        // There is probably a better way of doing this
        hasher.update(date.toString().toByteArray())
    }

    fun append(date: Instant) {
        // There is probably a better way of doing this
        hasher.update(date.toString().toByteArray())
    }

    fun build(): UUID {
        return UUID.nameUUIDFromBytes(hasher.digest())
    }

    override fun toString(): String {
        return build().toString()
    }
}

inline fun buildUUID(crossinline init: UUIDBuilder.() -> Unit): String {
    return UUIDBuilder().apply(init).toString()
}
