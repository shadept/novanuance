import com.mongodb.client.MongoDatabase
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.cache.*
import io.ktor.client.plugins.compression.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.compression.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.util.pipeline.*
import kotlinx.datetime.Instant
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.litote.kmongo.KMongo
import org.litote.kmongo.serialization.registerSerializer
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStream
import java.util.*
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation as ClientContentNegotiation
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation as ServerContentNegotiation

fun readResource(name: String): BufferedReader {
    return {}.javaClass.classLoader.getResourceAsStream(name)?.bufferedReader()
        ?: throw FileNotFoundException("Resource `$name` not found")
}

val packageProperties by lazy {
    val properties = Properties()
    properties.load(readResource("version.properties"))
    properties
}

val indexHtml by lazy {
    val packageVersion = packageProperties["version"]
    val content = readResource("index.html").use(BufferedReader::readText)
    content.replace("\"VERSION\"", "\"$packageVersion\"")
}

val httpClient = HttpClient {
    install(ClientContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
    install(ContentEncoding)
    install(HttpCache)
}


fun main() {
    registerSerializer(LocalDateBsonSerializer)
    registerSerializer(LocalDateTimeBsonSerializer)
    registerSerializer(InstantBsonSerializer)

    val connectionString = System.getenv("MONGO_DB") ?: throw IllegalArgumentException("MONGO_DB is not defined")
    val client = KMongo.createClient(connectionString)
    val database = client.getDatabase("novanuance")
    ensureSeededDatabase(database)

    embeddedServer(Netty, port = 8080) {
        plugins()
        reactSPA()
        employeeModule(database)
        reciteModule(database)
        vacationModule(database)
        holidaysModule()
    }.start(wait = true)
}

fun Application.plugins() {
    install(CallLogging)
    install(ServerContentNegotiation) {
        json(Json { ignoreUnknownKeys = true })
    }
    install(CORS) {
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Delete)
        allowHeader(HttpHeaders.ContentType)
        anyHost()
    }
    install(Compression) {
        gzip()
    }
}

fun Application.reactSPA() {
    routing {
//        singlePageApplication {
//            useResources = true
//        }
        get("/") {
            call.respondText(indexHtml, ContentType.Text.Html)
        }
        static("/") {
            resources()
        }
    }
}

fun Application.employeeModule(database: MongoDatabase) {
    @Serializable
    data class EmployeeDto(
        val id: String,
        val name: String,
        val title: String,
        val baseSalary: Double,
        val commissionPercent: Double,
        val thresholdForCommission: Double,
        val tax: Double,
        val taxedPercent: Double,
    )

    fun Employee.toDto() = EmployeeDto(id, name, title, baseSalary, commissionPercent, thresholdForCommission, tax, taxedPercent)

    routing {
        route("/employee") {
            get {
                val repo = MongoEmployeeRepository(database)
                val employees = repo.getAll().map(Employee::toDto)
                call.respond(employees)
            }
        }
    }
}

fun Application.holidaysModule() {
    @Serializable
    data class Holiday(
        val date: String,
        val localName: String,
        val name: String,
        val global: Boolean = true,
    )

    data class Parameters(val year: Int, val countryCode: String)

    fun PipelineContext<Unit, ApplicationCall>.holidayParameters(): Parameters {
        val year = call.parameters["year"]?.toInt() ?: error("Invalid year parameter")
        val countryCode = call.parameters["countryCode"] ?: error("Invalid countryCode parameters")
        if (!Locale.getISOCountries().contains(countryCode)) error("Invalid countryCode parameters")
        return Parameters(year, countryCode)
    }

    routing {
        route("/holidays/{year}/{countryCode}") {
            get {
                val (year, countryCode) = holidayParameters()
                val url = "https://date.nager.at/api/v3/PublicHolidays/$year/$countryCode"
                val response: MutableList<Holiday> = httpClient.get(url).body()
                response.removeIf { !it.global }
                if (countryCode == "PT") {
                    response.add(Holiday("$year-06-13", "Dia de Santo António", "St. Anthony's Day"))
                    response.sortBy { it.date }
                }
                call.respond(response)
            }
        }
    }
}

fun Application.reciteModule(database: MongoDatabase) {
    data class Parameters(val year: Int, val month: Int)

    fun PipelineContext<Unit, ApplicationCall>.reciteParameters(): Parameters {
        val year = call.parameters["year"]?.toInt() ?: error("Invalid year parameter")
        val month = call.parameters["month"]?.toInt() ?: error("Invalid month parameters")
        if (month < 1 || month > 12) error("Invalid month parameters")
        return Parameters(year, month)
    }

    routing {
        route("/recite") {
            get("/{year}/{month}") {
                val (year, month) = reciteParameters()
                val repo = MongoReciteRepository(database)
                val recites = repo.getByMonth(year, month)
                call.respond(recites)
            }
            post { recite: EmployeeRecite ->
                val repo = MongoReciteRepository(database)
                repo.update(recite)
                call.respond(HttpStatusCode.Created)
            }
        }
    }
}

fun Application.vacationModule(database: MongoDatabase) {
    @Serializable
    data class VacationDto(val id: String?, @Contextual val date: Instant, val employeeId: String) {
        fun toModel() = EmployeeVacation(date, employeeId)
    }

    fun EmployeeVacation.toDto() = VacationDto(id, date, employeeId)

    data class Parameters(val year: Int, val month: Int)

    fun PipelineContext<Unit, ApplicationCall>.reciteParameters(): Parameters {
        val year = call.parameters["year"]?.toInt() ?: error("Invalid year parameter")
        val month = call.parameters["month"]?.toInt() ?: error("Invalid month parameters")
        if (month < 1 || month > 12) error("Invalid month parameters")
        return Parameters(year, month)
    }

    routing {
        route("/vacation") {
            get("/{year}/{month}") {
                val (year, month) = reciteParameters()
                val repo = MongoVacationRepository(database)
                val vacations = repo.getByMonth(year, month).map(EmployeeVacation::toDto)
                call.respond(vacations)
            }
            post { vacation: VacationDto ->
                val repo = MongoVacationRepository(database)
                repo.insert(vacation.toModel())
                call.respond(HttpStatusCode.Created)
            }
            delete("/{id}") {
                val id = call.parameters["id"] ?: error("Invalid id parameter")
                val repo = MongoVacationRepository(database)
                repo.deleteById(id)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
