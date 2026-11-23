package ir.salon.app.di

import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import ir.salon.app.data.api.AuthApi
import ir.salon.app.data.api.BookingApi
import ir.salon.app.data.api.EngagementApi
import ir.salon.app.data.api.MoreApi
import ir.salon.app.data.api.SlotApi
import ir.salon.app.data.api.VenueApi
import ir.salon.app.data.repository.AuthRepository
import ir.salon.app.data.repository.AuthRepositoryImpl
import ir.salon.app.data.repository.BookingRepository
import ir.salon.app.data.repository.BookingRepositoryImpl
import ir.salon.app.data.repository.EngagementRepository
import ir.salon.app.data.repository.EngagementRepositoryImpl
import ir.salon.app.data.repository.MoreRepository
import ir.salon.app.data.repository.MoreRepositoryImpl
import ir.salon.app.data.repository.SlotRepository
import ir.salon.app.data.repository.SlotRepositoryImpl
import ir.salon.app.data.repository.VenueRepository
import ir.salon.app.data.repository.VenueRepositoryImpl
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object ApiModule {

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: retrofit2.Retrofit): AuthApi = retrofit.create(AuthApi::class.java)

    @Provides
    @Singleton
    fun provideVenueApi(retrofit: retrofit2.Retrofit): VenueApi = retrofit.create(VenueApi::class.java)

    @Provides
    @Singleton
    fun provideSlotApi(retrofit: retrofit2.Retrofit): SlotApi = retrofit.create(SlotApi::class.java)

    @Provides
    @Singleton
    fun provideBookingApi(retrofit: retrofit2.Retrofit): BookingApi = retrofit.create(BookingApi::class.java)

    @Provides
    @Singleton
    fun provideEngagementApi(retrofit: retrofit2.Retrofit): EngagementApi =
        retrofit.create(EngagementApi::class.java)

    @Provides
    @Singleton
    fun provideMoreApi(retrofit: retrofit2.Retrofit): MoreApi =
        retrofit.create(MoreApi::class.java)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindVenueRepository(impl: VenueRepositoryImpl): VenueRepository

    @Binds
    @Singleton
    abstract fun bindSlotRepository(impl: SlotRepositoryImpl): SlotRepository

    @Binds
    @Singleton
    abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository

    @Binds
    @Singleton
    abstract fun bindEngagementRepository(impl: EngagementRepositoryImpl): EngagementRepository

    @Binds
    @Singleton
    abstract fun bindMoreRepository(impl: MoreRepositoryImpl): MoreRepository
}
