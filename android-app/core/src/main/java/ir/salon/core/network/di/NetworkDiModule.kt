package ir.salon.core.network.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import ir.salon.core.network.RetrofitProvider
import kotlinx.serialization.json.Json
import javax.inject.Singleton

/** نگار JSON سراسری: فیلدهای ناشناخته نادیده (سازگاری رو به جلو با API) */
@Module
@InstallIn(SingletonComponent::class)
object SerializationModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        coerceInputValues = true
    }
}

/** Retrofit و هر سرویس API از همین ماژول تزریق می‌شود */
@Module
@InstallIn(SingletonComponent::class)
object NetworkDiModule {

    @Provides
    @Singleton
    fun provideRetrofit(provider: RetrofitProvider): retrofit2.Retrofit = provider.retrofit
}
