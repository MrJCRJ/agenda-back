import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  NotFoundException,
  Patch,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { AppointmentService } from "../services/appointment.service";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import {
  Appointment,
  AppointmentDocument,
} from "../schemas/appointment.schema";
import * as mongoose from "mongoose";

@Controller("appointments")
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto
  ): Promise<Appointment> {
    return this.appointmentService.create(createAppointmentDto);
  }

  @Get()
  async findAll(): Promise<Appointment[]> {
    return this.appointmentService.findAll();
  }

  @Get("grouped-by-title")
  async findAllGroupedByTitle(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.appointmentService.findAllGroupedByTitle(startDate, endDate);
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Appointment> {
    const appointment = await this.appointmentService.findOne(id);
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    return appointment;
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentService.update(
      id,
      updateAppointmentDto
    );
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    return appointment;
  }

  @Delete(":id")
  async delete(@Param("id") id: string): Promise<{ message: string }> {
    const appointment = await this.appointmentService.delete(id);
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    return { message: "Appointment deleted successfully" };
  }

  @Post(":id/tasks")
  async addTask(
    @Param("id") id: string,
    @Body() task: { description: string; completed?: boolean }
  ): Promise<Appointment> {
    try {
      const appointment = await this.appointmentService.addTask(id, {
        ...task,
        completed: task.completed || false,
      });
      if (!appointment) {
        throw new NotFoundException("Appointment not found");
      }
      return appointment;
    } catch (error: unknown) {
      // Adicione a tipagem como unknown
      if (error instanceof Error) {
        // Verificação de tipo
        console.error(`[AddTask] Erro - ${error.message}`, error.stack);
        throw new NotFoundException(error.message);
      }
      console.error("[AddTask] Erro desconhecido", error);
      throw new NotFoundException("Ocorreu um erro inesperado");
    }
  }

  @Patch(":appointmentId/tasks/:taskId")
  async updateTask(
    @Param("appointmentId") appointmentId: string,
    @Param("taskId") taskId: string,
    @Body() updateData: { completed: boolean }
  ) {
    // Validação adicional
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new BadRequestException("Invalid task ID format");
    }

    return this.appointmentService.updateTask(appointmentId, taskId, {
      completed: updateData.completed,
    });
  }

  @Delete(":id/tasks/:taskId")
  async removeTask(
    @Param("id") id: string,
    @Param("taskId") taskId: string
  ): Promise<Appointment> {
    const appointment = await this.appointmentService.removeTask(id, taskId);
    if (!appointment) {
      throw new NotFoundException("Appointment or task not found");
    }
    return appointment;
  }
}
