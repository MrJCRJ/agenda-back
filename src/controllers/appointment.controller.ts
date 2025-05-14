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
} from "@nestjs/common";
import { AppointmentService } from "../services/appointment.service";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import {
  Appointment,
  AppointmentDocument,
} from "../schemas/appointment.schema";
import * as mongoose from "mongoose";

// Definindo o tipo Task baseado no seu schema
type Task = {
  _id?: mongoose.Types.ObjectId;
  description: string;
  completed: boolean;
};

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

  @Post(":id/tasks")
  async addTask(
    @Param("id") id: string,
    @Body() task: { description: string; completed?: boolean }
  ): Promise<Appointment> {
    const appointment = await this.appointmentService.addTask(id, {
      ...task,
      completed: task.completed || false,
    });
    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }
    return appointment;
  }

  @Patch(":id/tasks/:taskId")
  async updateTask(
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() update: { description?: string; completed?: boolean }
  ): Promise<Task> {
    // Validação dos IDs
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      throw new BadRequestException("Invalid ID format");
    }

    const appointment = await this.appointmentService.updateTask(
      id,
      taskId,
      update
    );

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    // Encontra a tarefa atualizada
    const updatedTask = appointment.tasks.find(
      (task) => task._id && task._id.toString() === taskId
    );

    if (!updatedTask) {
      throw new NotFoundException("Task not found after update");
    }

    return updatedTask;
  }

  @Delete(":id/tasks/:taskId")
  async removeTask(
    @Param("id") id: string,
    @Param("taskId") taskId: string
  ): Promise<Appointment> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid appointment ID format");
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new BadRequestException("Invalid task ID format");
    }

    const appointment = await this.appointmentService.removeTask(id, taskId);
    if (!appointment) {
      throw new NotFoundException("Appointment or task not found");
    }
    return appointment;
  }
}
