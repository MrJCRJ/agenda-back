import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppointmentController } from "./controllers/appointment.controller";
import { AppointmentService } from "./services/appointment.service";
import { Appointment, AppointmentSchema } from "./schemas/appointment.schema";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGODB_URI"),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
    HttpModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppModule {}
