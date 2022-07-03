import com.mongodb.client.MongoDatabase
import org.litote.kmongo.setValue
import org.litote.kmongo.updateOneById

val employees = mutableListOf(
    Employee("Casa", "owner", 0.0, 0.0),
    Employee("Carla", "hairdresser", 627.45, 0.15, thresholdForCommission = 1410.0),
    Employee("Cristina", "hairdresser", 0.0, 0.4, taxedPercent = 0.5),
    Employee("Pedro", "barber", 0.0, 0.65, tax = 0.0),
    Employee("Isabel", "manicurist", 627.45, 0.8),
    Employee("Sara", "beautician", 627.45, 0.8),
)

fun recreateDatabase(database: MongoDatabase) {
    database.getCollection("employees").drop()
    database.getCollection("recites").drop()
    database.createCollection("employees")
    database.createCollection("recites")
}

fun ensureSeededDatabase(database: MongoDatabase, recreate: Boolean = false) {
    if (recreate) recreateDatabase(database)
    val employeesCollection = database.getCollection("employees", Employee::class.java)
    if (employeesCollection.countDocuments() == 0L) {
        employeesCollection.insertMany(employees)
    } else {
        employees.forEach { e -> employeesCollection.updateOneById(e.id, setValue(Employee::title, e.title)) }
    }
}
