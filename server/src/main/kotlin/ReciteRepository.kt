import com.mongodb.client.MongoCollection
import com.mongodb.client.MongoDatabase
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.litote.kmongo.*


@Serializable
data class EmployeeRecite(
    @Contextual val date: Instant,
    val employeeId: String,
    val value: Double,
) {
    @Contextual
    @SerialName("_id")
    val id: String = buildUUID {
        append(employeeId)
        append(date)
    }
}

interface ReciteRepository {
    suspend fun getAll(): List<EmployeeRecite>
    suspend fun getByMonth(year: Int, month: Int): List<EmployeeRecite>
    suspend fun insert(recite: EmployeeRecite)
    suspend fun update(recite: EmployeeRecite)
    suspend fun delete(recite: EmployeeRecite)
}

class MongoReciteRepository(database: MongoDatabase) : ReciteRepository {
    private val collection: MongoCollection<EmployeeRecite> = database.getCollection("recites", EmployeeRecite::class.java)

    override suspend fun getAll(): List<EmployeeRecite> = collection.find().toList()

    override suspend fun getByMonth(year: Int, month: Int): List<EmployeeRecite> {
        val query = "{\$expr: {\$and: [{\$eq: [{\$year: '\$date'}, $year]}, {\$eq: [{\$month: '\$date'}, $month]}]}}"
        return collection.find(query).toList()
    }

    override suspend fun insert(recite: EmployeeRecite) {
        collection.insertOne(recite)
    }

    override suspend fun update(recite: EmployeeRecite) {
        collection.updateOneById(recite.id, recite, upsert())
    }

    override suspend fun delete(recite: EmployeeRecite) {
        collection.deleteOneById(recite.id)
    }
}
