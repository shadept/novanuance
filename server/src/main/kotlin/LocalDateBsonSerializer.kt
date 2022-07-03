import com.github.jershell.kbson.BsonEncoder
import com.github.jershell.kbson.FlexibleDecoder
import kotlinx.datetime.*
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import org.bson.BsonType
import java.util.concurrent.TimeUnit

object LocalDateBsonSerializer : KSerializer<LocalDate> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("LocalDate", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: LocalDate) {
        encoder as BsonEncoder
        encoder.encodeDateTime(value.atStartOfDayIn(TimeZone.UTC).toEpochMilliseconds())
    }

    override fun deserialize(decoder: Decoder): LocalDate {
        return when (decoder) {
            is FlexibleDecoder -> {
                Instant.fromEpochMilliseconds(
                    when (decoder.reader.currentBsonType) {
                        BsonType.STRING -> decoder.decodeString().toLong()
                        BsonType.DATE_TIME -> decoder.reader.readDateTime()
                        BsonType.INT32 -> decoder.decodeInt().toLong()
                        BsonType.INT64 -> decoder.decodeLong()
                        BsonType.DOUBLE -> decoder.decodeDouble().toLong()
                        BsonType.DECIMAL128 -> decoder.reader.readDecimal128().toLong()
                        BsonType.TIMESTAMP -> TimeUnit.SECONDS.toMillis(decoder.reader.readTimestamp().time.toLong())
                        else -> throw SerializationException("Unsupported ${decoder.reader.currentBsonType} reading date")
                    }
                ).toLocalDateTime(TimeZone.UTC).date
            }
            else -> throw SerializationException("Unknown decoder type")
        }
    }
}

object LocalDateTimeBsonSerializer : KSerializer<LocalDateTime> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("LocalDateTime", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: LocalDateTime) {
        encoder as BsonEncoder
        encoder.encodeDateTime(value.toInstant(TimeZone.UTC).toEpochMilliseconds())
    }

    override fun deserialize(decoder: Decoder): LocalDateTime {
        return when (decoder) {
            is FlexibleDecoder -> {
                Instant.fromEpochMilliseconds(
                    when (decoder.reader.currentBsonType) {
                        BsonType.STRING -> decoder.decodeString().toLong()
                        BsonType.DATE_TIME -> decoder.reader.readDateTime()
                        BsonType.INT32 -> decoder.decodeInt().toLong()
                        BsonType.INT64 -> decoder.decodeLong()
                        BsonType.DOUBLE -> decoder.decodeDouble().toLong()
                        BsonType.DECIMAL128 -> decoder.reader.readDecimal128().toLong()
                        BsonType.TIMESTAMP -> TimeUnit.SECONDS.toMillis(decoder.reader.readTimestamp().time.toLong())
                        else -> throw SerializationException("Unsupported ${decoder.reader.currentBsonType} reading date")
                    }
                ).toLocalDateTime(TimeZone.UTC)
            }
            else -> throw SerializationException("Unknown decoder type")
        }
    }
}

object InstantBsonSerializer : KSerializer<Instant> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("LocalDateTime", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: Instant) {
        encoder as BsonEncoder
        encoder.encodeDateTime(value.toEpochMilliseconds())
    }

    override fun deserialize(decoder: Decoder): Instant {
        return when (decoder) {
            is FlexibleDecoder -> {
                Instant.fromEpochMilliseconds(
                    when (decoder.reader.currentBsonType) {
                        BsonType.STRING -> decoder.decodeString().toLong()
                        BsonType.DATE_TIME -> decoder.reader.readDateTime()
                        BsonType.INT32 -> decoder.decodeInt().toLong()
                        BsonType.INT64 -> decoder.decodeLong()
                        BsonType.DOUBLE -> decoder.decodeDouble().toLong()
                        BsonType.DECIMAL128 -> decoder.reader.readDecimal128().toLong()
                        BsonType.TIMESTAMP -> TimeUnit.SECONDS.toMillis(decoder.reader.readTimestamp().time.toLong())
                        else -> throw SerializationException("Unsupported ${decoder.reader.currentBsonType} reading date")
                    }
                )
            }
            else -> throw SerializationException("Unknown decoder type")
        }
    }
}
