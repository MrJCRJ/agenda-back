// appointment.service.ts
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as mongoose from "mongoose";
import {
  Appointment,
  AppointmentDocument,
} from "../schemas/appointment.schema";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import { RRule } from "rrule";
import { Injectable, Logger } from "@nestjs/common";

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
    if (
      createAppointmentDto.isRecurring &&
      createAppointmentDto.recurrenceRule
    ) {
      return this.createRecurringAppointments(createAppointmentDto);
    }

    const createdAppointment = new this.appointmentModel(createAppointmentDto);
    return createdAppointment.save();
  }

  private async createRecurringAppointments(
    createAppointmentDto: CreateAppointmentDto
  ): Promise<Appointment> {
    const recurrenceId = new mongoose.Types.ObjectId().toString();

    // Criar o primeiro evento da série
    const firstAppointment = new this.appointmentModel({
      ...createAppointmentDto,
      recurrenceId,
      originalStart: createAppointmentDto.start,
    });

    await firstAppointment.save();

    // Verificar se recurrenceRule existe e é uma string válida
    if (!createAppointmentDto.recurrenceRule) {
      throw new Error("Recurrence rule is required for recurring appointments");
    }

    try {
      // Parse a regra de recorrência
      const rule = RRule.fromString(createAppointmentDto.recurrenceRule);
      const dates = rule.all();

      // Remover o primeiro evento (já criado)
      dates.shift();

      // Criar os demais eventos
      for (const date of dates) {
        const newAppointment = new this.appointmentModel({
          ...createAppointmentDto,
          start: date.toISOString(),
          end: this.calculateEndDate(
            createAppointmentDto.start,
            createAppointmentDto.end,
            date
          ),
          recurrenceId,
          originalStart: createAppointmentDto.start,
        });
        await newAppointment.save();
      }
    } catch (error) {
      console.error("Error parsing recurrence rule:", error);
      // Se houver erro na regra de recorrência, deletar o primeiro evento criado
      await this.appointmentModel.deleteOne({ _id: firstAppointment._id });
      throw new Error("Invalid recurrence rule: " + error);
    }

    return firstAppointment;
  }

  private calculateEndDate(
    originalStart: string,
    originalEnd: string,
    newStart: Date
  ): string {
    const startDate = new Date(originalStart);
    const endDate = new Date(originalEnd);
    const duration = endDate.getTime() - startDate.getTime();
    const newEndDate = new Date(newStart.getTime() + duration);
    return newEndDate.toISOString();
  }

  async findAll(): Promise<Appointment[]> {
    return this.appointmentModel.find().exec();
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

    if (appointment.recurrenceId && !updateAppointmentDto.originalStart) {
      return this.handleRecurringUpdate(appointment, updateAppointmentDto);
    }

    return this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .exec();
  }

  private async handleRecurringUpdate(
    originalAppointment: AppointmentDocument,
    updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment> {
    // Criar um novo evento com as modificações
    const modifiedAppointment = new this.appointmentModel({
      ...originalAppointment.toObject(),
      ...updateAppointmentDto,
      originalStart: originalAppointment.start,
      recurrenceId: originalAppointment.recurrenceId,
      _id: undefined,
    });

    await modifiedAppointment.save();

    // Atualizar eventos futuros para remover a recorrência
    await this.appointmentModel.updateMany(
      {
        recurrenceId: originalAppointment.recurrenceId,
        start: { $gt: originalAppointment.start },
      },
      { $set: { recurrenceId: undefined } }
    );

    return modifiedAppointment;
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

      // Opção 2: Descomente para deletar todos os eventos futuros da série
      /*
      await this.appointmentModel.deleteMany({
        $or: [
          { _id: appointment._id },
          {
            recurrenceId: appointment.recurrenceId,
            start: { $gt: appointment.start }
          }
        ]
      });
      return appointment;
      */
    }

    return this.appointmentModel.findByIdAndDelete(id).exec();
  }

  // Métodos opcionais para tarefas
  async addTask(
    appointmentId: string,
    task: { description: string; completed?: boolean }
  ): Promise<Appointment | null> {
    return this.appointmentModel
      .findByIdAndUpdate(
        appointmentId,
        { $push: { tasks: { ...task, _id: new mongoose.Types.ObjectId() } } },
        { new: true }
      )
      .exec();
  }

  async updateTask(
    appointmentId: string,
    taskId: string,
    update: { description?: string; completed?: boolean }
  ): Promise<Appointment | null> {
    this.logger.debug(
      `Tentando atualizar tarefa - Appointment: ${appointmentId}, Task: ${taskId}`,
      { update }
    );

    // Verificar se os IDs são válidos
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      this.logger.error(`ID de agendamento inválido: ${appointmentId}`);
      throw new Error("ID de agendamento inválido");
    }

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      this.logger.error(`ID de tarefa inválido: ${taskId}`);
      throw new Error("ID de tarefa inválido");
    }

    // Criar objeto de atualização dinâmico
    const updateObj: Record<string, any> = {};

    if (update.description !== undefined) {
      updateObj["tasks.$[elem].description"] = update.description;
    }

    if (update.completed !== undefined) {
      updateObj["tasks.$[elem].completed"] = update.completed;
    }

    try {
      const result = await this.appointmentModel
        .findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(appointmentId),
            "tasks._id": new mongoose.Types.ObjectId(taskId),
          },
          {
            $set: updateObj,
          },
          {
            new: true,
            arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(taskId) }],
          }
        )
        .exec();

      if (!result) {
        this.logger.warn(
          `Tarefa não encontrada - Appointment: ${appointmentId}, Task: ${taskId}`
        );
        throw new Error("Agendamento ou tarefa não encontrado");
      }

      this.logger.log(
        `Tarefa atualizada com sucesso - Appointment: ${appointmentId}, Task: ${taskId}`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Falha ao atualizar tarefa - Appointment: ${appointmentId}, Task: ${taskId}`,
        error
      );
      throw new Error(`Falha ao atualizar tarefa: ${error}`);
    }
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
