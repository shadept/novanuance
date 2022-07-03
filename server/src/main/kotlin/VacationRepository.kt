import com.mongodb.client.MongoCollection
import com.mongodb.client.MongoDatabase
import kotlinx.datetime.Instant
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.litote.kmongo.*


@Serializable
data class EmployeeVacation(
    @Contextual val date: Instant,
    val employeeId: String,
) {
    @Contextual
    @SerialName("_id")
    val id: String = buildUUID {
        append(employeeId)
        append(date)
    }
}

interface VacationRepository {
    suspend fun getAll(): List<EmployeeVacation>
    suspend fun getByMonth(year: Int, month: Int): List<EmployeeVacation>
    suspend fun insert(vacation: EmployeeVacation)
    suspend fun deleteById(id: String)
}

class MongoVacationRepository(database: MongoDatabase) : VacationRepository {
    private val collection: MongoCollection<EmployeeVacation> = database.getCollection("vacations", EmployeeVacation::class.java)

    override suspend fun getAll(): List<EmployeeVacation> = collection.find().toList()

    override suspend fun getByMonth(year: Int, month: Int): List<EmployeeVacation> {
        val query = "{\$expr: {\$and: [{\$eq: [{\$year: '\$date'}, $year]}, {\$eq: [{\$month: '\$date'}, $month]}]}}"
        return collection.find(query).toList()
    }

    override suspend fun insert(vacation: EmployeeVacation) {
        collection.insertOne(vacation)
    }

    override suspend fun deleteById(id: String) {
        collection.deleteOneById(id)
    }
}
