import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import java.io.FileWriter
import java.util.Properties


val ktor_version = "2.0.2"
val kmongo_version = "4.6.0"
val logback_version = "1.2.11"

group = "pt.thanatos"

plugins {
    kotlin("jvm") version "1.7.0"
    kotlin("plugin.serialization") version "1.7.0"
    application
    id("com.github.johnrengelman.shadow") version "7.1.2"
    id("com.glovoapp.semantic-versioning") version "1.1.8"
}

repositories {
    mavenCentral()
}

dependencies {
//    runtimeOnly(project(":client"))

    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.3.2")
    implementation("org.litote.kmongo:kmongo-id:$kmongo_version")
    implementation("ch.qos.logback:logback-classic:$logback_version")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktor_version")
    implementation("io.ktor:ktor-server-netty:$ktor_version")
    implementation("io.ktor:ktor-server-caching-headers:$ktor_version")
    implementation("io.ktor:ktor-server-call-logging:$ktor_version")
    implementation("io.ktor:ktor-server-compression:$ktor_version")
    implementation("io.ktor:ktor-server-content-negotiation:$ktor_version")
    implementation("io.ktor:ktor-server-cors:$ktor_version")
    implementation("io.ktor:ktor-client-core:$ktor_version")
    implementation("io.ktor:ktor-client-cio:$ktor_version")
    implementation("io.ktor:ktor-client-content-negotiation:$ktor_version")
    implementation("io.ktor:ktor-client-encoding:$ktor_version")
    implementation("com.github.jershell:kbson:0.4.4")
    implementation("org.litote.kmongo:kmongo:$kmongo_version")
    implementation("org.litote.kmongo:kmongo-serialization:$kmongo_version")
    implementation("org.litote.kmongo:kmongo-id-serialization:$kmongo_version")

    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}

tasks.withType<KotlinCompile> {
    kotlinOptions.jvmTarget = "11"
}

application {
    mainClass.set("MainKt")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=true")
}

tasks.named<Copy>("processResources") {
    from(project(":client").buildDir)
}

tasks.named<JavaExec>("run") {
    dependsOn(tasks.named<Jar>("jar"))
    classpath(tasks.named<Jar>("jar"))
}

tasks.jar {
    manifest {
        attributes["Main-Class"] = "MainKt"
        attributes["Implementation-Version"] = project.semanticVersion.version.get()
    }
}

task("createProperties") {
    doLast {
//        val details = versionDetails()
        File("$buildDir/resources/main/version.properties").withWriter { w ->
            val p = Properties()
            p["version"] = project.semanticVersion.version.get().toString()
//            p['gitLastTag'] = details.lastTag
//            p['gitCommitDistance'] = details.commitDistance.toString()
//            p['gitHash'] = details.gitHash.toString()
//            p['gitHashFull'] = details.gitHashFull.toString() // full 40-character Git commit hash
//            p['gitBranchName'] = details.branchName // is null if the repository in detached HEAD mode
//            p['gitIsCleanTag'] = details.isCleanTag.toString()
            p.store(w, null)
        }
        // copy needed for runtime loading
//        copy {
//            from("$buildDir/resources/main/version.properties")
//            into("bin/main/")
//        }
    }
}

tasks.named("processResources") {
    dependsOn.add("createProperties")
}

task("printVersion") {
    doLast {
        println(project.semanticVersion.version.get())
    }
}

fun File.withWriter(fn: (FileWriter) -> Unit) {
    val writer = FileWriter(this)
    fn(writer)
}
