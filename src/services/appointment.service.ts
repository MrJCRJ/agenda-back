// appointment.service.ts
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as mongoose from "mongoose";
import {
  Appointment,
  AppointmentDocument,
} from "../schemas/appointment.schema";
import { CreateAppointmentDto, TaskDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import { Injectable, Logger } from "@nestjs/common";

type TaskCreate = Omit<TaskDto, "_id"> & {
  completed?: boolean;
};

interface Duration {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

interface GroupedAppointment {
  title: string;
  totalDuration: Duration;
  appointments: Appointment[];
}

interface AppointmentDuration {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
}

export interface GroupedAppointmentsResponse {
  title: string;
  totalDuration: AppointmentDuration;
  appointments: Appointment[];
}

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto
  ): Promise<Appointment> {
    const createdAppointment = new this.appointmentModel(createAppointmentDto);
    return createdAppointment.save();
  }

  async findAll(): Promise<Appointment[]> {
    const appointments = await this.appointmentModel.find().exec();

    return appointments.map((appointment) => {
      // Convertendo strings para Date antes de calcular
      const startDate = new Date(appointment.start);
      const endDate = new Date(appointment.end);
      const duration = this.calculateDuration(startDate, endDate);

      return {
        ...appointment.toObject(),
        duration,
      };
    });
  }

  async findAllGroupedByTitle(
    startDateFilter?: string,
    endDateFilter?: string
  ): Promise<GroupedAppointmentsResponse[]> {
    try {
      const filter: any = {};

      // Adiciona filtros diretamente sem conversão
      if (startDateFilter) {
        filter.start = { $gte: startDateFilter };
      }
      if (endDateFilter) {
        filter.end = { $lte: endDateFilter };
      }

      // Find appointments with filters
      const appointments = await this.appointmentModel.find(filter).exec();

      // Early return if no appointments found
      if (appointments.length === 0) {
        return [];
      }

      // Group by title
      const groupedByTitle = appointments.reduce((acc, appointment) => {
        const startDate = new Date(appointment.start);
        const endDate = new Date(appointment.end);

        // Calculate duration correctly
        const durationMs = endDate.getTime() - startDate.getTime();
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (!acc[appointment.title]) {
          acc[appointment.title] = {
            title: appointment.title,
            totalDuration: {
              hours: 0,
              minutes: 0,
              totalMinutes: 0,
            },
            appointments: [],
          };
        }

        // Accumulate durations
        acc[appointment.title].totalDuration.hours += hours;
        acc[appointment.title].totalDuration.minutes += minutes;
        acc[appointment.title].totalDuration.totalMinutes += totalMinutes;
        acc[appointment.title].appointments.push(appointment);

        return acc;
      }, {} as Record<string, GroupedAppointment>);

      // Convert to array and format output
      return Object.values(groupedByTitle).map((group) => {
        const totalMinutes = group.totalDuration.totalMinutes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
          title: group.title,
          appointments: group.appointments,
          totalDuration: {
            hours,
            minutes,
            totalMinutes,
            formatted: `${hours > 0 ? `${hours}h ` : ""}${minutes}m`,
          },
        };
      });
    } catch (error) {
      this.logger.error("Error in findAllGroupedByTitle", error);
      throw error;
    }
  }

  private calculateDuration(start: Date, end: Date) {
    const diffInMs = end.getTime() - start.getTime();

    return {
      hours: Math.floor(diffInMs / (1000 * 60 * 60)),
      minutes: Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60)),
      totalMinutes: Math.floor(diffInMs / (1000 * 60)),
      formatted: this.formatDuration(diffInMs),
    };
  }

  private formatDuration(diffInMs: number): string {
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
  }

  async findOne(id: string): Promise<Appointment | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.appointmentModel.findById(id).exec();
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentModel.findById(id).exec();

    if (!appointment) {
      return null;
    }

    return this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Appointment | null> {
    const appointment = await this.appointmentModel.findById(id).exec();

    if (!appointment) {
      return null;
    }

    if (appointment.recurrenceId) {
      // Opção 1: Deletar apenas este evento (criando uma exceção)
      const modifiedAppointment = new this.appointmentModel({
        ...appointment.toObject(),
        isRecurring: false,
        recurrenceId: undefined,
        originalStart: undefined,
        _id: undefined,
      });

      await modifiedAppointment.save();
      await this.appointmentModel.deleteOne({ _id: appointment._id });

      return modifiedAppointment;
    }

    return this.appointmentModel.findByIdAndDelete(id).exec();
  }

  // Métodos opcionais para tarefas
  async addTask(
    appointmentId: string,
    taskData: TaskCreate
  ): Promise<Appointment> {
    console.log(`[Service] AddTask iniciado - Appointment: ${appointmentId}`, {
      taskData,
      dbOperation: "findByIdAndUpdate",
    });

    const updatedAppointment = await this.appointmentModel
      .findByIdAndUpdate(
        appointmentId,
        { $push: { tasks: taskData } },
        { new: true, runValidators: true }
      )
      .exec();

    if (!updatedAppointment) {
      console.error(
        `[Service] AddTask falhou - Appointment não encontrado: ${appointmentId}`
      );
      throw new Error("Appointment not found");
    }

    console.log(`[Service] AddTask concluído - Appointment: ${appointmentId}`, {
      newTaskId: updatedAppointment.tasks.slice(-1)[0]._id,
      taskCount: updatedAppointment.tasks.length,
      dbResponse: {
        status: "success",
        modifiedCount: 1, // Para operações de update
      },
    });

    return updatedAppointment;
  }

  // appointment.service.ts
  async updateTask(appointmentId: string, taskId: string, updateData: any) {
    // VALIDAÇÃO CRÍTICA
    if (appointmentId === taskId) {
      throw new Error("Invalid task ID: cannot be same as appointment ID");
    }
    const appId = new Types.ObjectId(appointmentId);
    const tId = new Types.ObjectId(taskId);

    const updated = await this.appointmentModel.findOneAndUpdate(
      {
        _id: appId,
        "tasks._id": tId,
      },
      {
        $set: {
          "tasks.$.completed": updateData.completed,
          "tasks.$.updatedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error("Task not found");
    }

    return updated;
  }

  async removeTask(
    appointmentId: string,
    taskId: string
  ): Promise<Appointment | null> {
    this.logger.debug(
      `Tentando remover tarefa - Appointment: ${appointmentId}, Task: ${taskId}`
    );

    try {
      const result = await this.appointmentModel
        .findByIdAndUpdate(
          appointmentId,
          { $pull: { tasks: { _id: new mongoose.Types.ObjectId(taskId) } } },
          { new: true }
        )
        .exec();

      if (!result) {
        this.logger.warn(
          `Tarefa não encontrada para remoção - Appointment: ${appointmentId}, Task: ${taskId}`
        );
        return null;
      }

      this.logger.log(
        `Tarefa removida com sucesso - Appointment: ${appointmentId}, Task: ${taskId}`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Falha ao remover tarefa - Appointment: ${appointmentId}, Task: ${taskId}`,
        error
      );
      throw error;
    }
  }
}
