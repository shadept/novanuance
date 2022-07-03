import com.mongodb.client.MongoDatabase
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import org.litote.kmongo.deleteOneById
import org.litote.kmongo.eq
import org.litote.kmongo.findOne
import org.litote.kmongo.updateOneById
import kotlin.math.max
import kotlin.math.round

const val defaultTax: Double = 0.23


@Serializable
data class Employee(
    val name: String,
    val title: String,
    val baseSalary: Double,
    val commissionPercent: Double,
    val thresholdForCommission: Double = 0.0,
    val tax: Double = defaultTax,
    val taxedPercent: Double = 1.0,
) {
    @Contextual
    @SerialName("_id")
    val id: String = buildUUID { append(name) }

    fun calcPaycheck(recitesTotal: Double): Double {
        val afterTaxes = recitesTotal * taxedPercent * (1.0 - tax) + recitesTotal * (1.0 - taxedPercent)
        return round(baseSalary + max(afterTaxes - thresholdForCommission, 0.0) * commissionPercent, 3)
    }
}

fun round(value: Double, decimals: Int): Double {
    var multiplier = 1.0
    repeat(decimals) { multiplier *= 10 }
    return round(value * multiplier) / multiplier
}

interface EmployeeRepository {
    suspend fun getAll(): List<Employee>
    suspend fun getById(employeeId: String): Employee?
    suspend fun insert(employee: Employee)
    suspend fun update(employee: Employee)
    suspend fun delete(employee: Employee)
}

class MongoEmployeeRepository(database: MongoDatabase) : EmployeeRepository {
    private val collection = database.getCollection("employees", Employee::class.java)

    override suspend fun getAll(): List<Employee> {
        return collection.find().toList()
    }

    override suspend fun getById(employeeId: String): Employee? {
        return collection.findOne(Employee::id eq employeeId)
    }

    override suspend fun insert(employee: Employee) {
        collection.insertOne(employee)
    }

    override suspend fun update(employee: Employee) {
        collection.updateOneById(employee.id, employee)
    }

    override suspend fun delete(employee: Employee) {
        collection.deleteOneById(employee.id)
    }
}
