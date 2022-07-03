import com.github.gradle.node.npm.task.NpxTask

plugins {
    id("com.github.node-gradle.node") version "3.3.0"
}

val npmInstall = tasks.named("npmInstall")

val buildTask = tasks.register("build", NpxTask::class) {
    dependsOn(npmInstall)
    command.set("react-scripts")
    args.set(listOf("build"))
    inputs.dir("node_modules")
    inputs.dir("public")
    inputs.dir(fileTree("src").exclude("**/*.test.tsx?"))
    outputs.dir("$buildDir")
}
