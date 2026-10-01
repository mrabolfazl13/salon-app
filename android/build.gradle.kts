allprojects {
    repositories {
        // Iranian mirrors (top priority for sanctions bypass)
        maven { url = uri("https://maven.myket.ir/repository/maven-public/") }
        maven { url = uri("https://maven.devneeds.ir/repository/maven-public/") }
        maven { url = uri("https://gradle.iranrepo.ir/repository/maven-public/") }
        maven { url = uri("https://gradle.jamko.ir/repository/maven-public/") }
        maven { url = uri("https://en-mirror.ir/repository/maven-public/") }
        maven { url = uri("https://archive.ito.gov.ir/repository/maven-public/") }
        // Chinese mirrors (secondary)
        maven { url = uri("https://repo.huaweicloud.com/repository/maven/") }
        maven { url = uri("https://maven.aliyun.com/repository/google") }
        maven { url = uri("https://maven.aliyun.com/repository/public") }
        // Official repos (fallback)
        google()
        mavenCentral()
    }
}

// Force all subprojects (plugins) to use the same repositories
subprojects {
    buildscript {
        repositories {
            maven { url = uri("https://maven.myket.ir/repository/maven-public/") }
            maven { url = uri("https://maven.devneeds.ir/repository/maven-public/") }
            maven { url = uri("https://gradle.iranrepo.ir/repository/maven-public/") }
            maven { url = uri("https://gradle.jamko.ir/repository/maven-public/") }
            maven { url = uri("https://en-mirror.ir/repository/maven-public/") }
            maven { url = uri("https://archive.ito.gov.ir/repository/maven-public/") }
            maven { url = uri("https://repo.huaweicloud.com/repository/maven/") }
            maven { url = uri("https://maven.aliyun.com/repository/google") }
            maven { url = uri("https://maven.aliyun.com/repository/public") }
            google()
            mavenCentral()
        }
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
