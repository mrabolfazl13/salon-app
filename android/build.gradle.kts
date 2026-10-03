// Flutter plugins pin their own AGP/Kotlin versions (7.3.1..1.7.22 era); a single modern
// pair keeps every plugin project buildable under the wrapper's Gradle version.
val unifiedAgpVersion = "8.12.0"
val unifiedKotlinVersion = "2.2.20"

allprojects {
    buildscript {
        repositories {
            google()
            mavenCentral()
            maven { url = uri("https://repo.huaweicloud.com/repository/maven/") }
            maven { url = uri("https://maven.aliyun.com/repository/google") }
            maven { url = uri("https://maven.aliyun.com/repository/public") }
        }
        configurations.all {
            resolutionStrategy {
                force("com.android.tools.build:gradle:$unifiedAgpVersion")
                force("org.jetbrains.kotlin:kotlin-gradle-plugin:$unifiedKotlinVersion")
            }
        }
    }
    repositories {
        google()
        mavenCentral()
        // Fallbacks for regions where Google Maven is unreachable (404); CI resolves from the repos above
        maven { url = uri("https://repo.huaweicloud.com/repository/maven/") }
        maven { url = uri("https://maven.aliyun.com/repository/google") }
        maven { url = uri("https://maven.aliyun.com/repository/public") }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
