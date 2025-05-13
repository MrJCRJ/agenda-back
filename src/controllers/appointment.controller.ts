// appointment.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  NotFoundException,
} from "@nestjs/common";
import { AppointmentService } from "../services/appointment.service";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import { Appointment } from "../schemas/appointment.schema";

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

  // Endpoints para tarefas
  @Post(":id/tasks")
  async addTask(
    @Param("id") id: string,
    @Body() task: { description: string; completed?: boolean }
  ): Promise<Appointment> {
    const appointment = await this.appointmentService.addTask(id, task);
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    return appointment;
  }

  @Put(":id/tasks/:taskId")
  async updateTask(
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() update: { description?: string; completed?: boolean }
  ): Promise<Appointment> {
    const appointment = await this.appointmentService.updateTask(
      id,
      taskId,
      update
    );
    if (!appointment) {
      throw new NotFoundException("Appointment or task not found");
    }
    return appointment;
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
