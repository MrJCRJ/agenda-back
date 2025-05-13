// appointment.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AppointmentDocument = Appointment & Document;

class Task {
  @Prop({ required: true })
  description!: string;

  @Prop({ default: false })
  completed!: boolean;
}

@Schema()
export class Appointment {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  start!: string;

  @Prop({ required: true })
  end!: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  // Campos para recorrência
  @Prop({ default: false })
  isRecurring!: boolean;

  @Prop()
  recurrenceRule?: string; // Poderia ser uma string no formato RRULE (RFC 5545)

  @Prop()
  recurrenceId?: string; // Para agrupamento de eventos recorrentes

  @Prop()
  originalStart?: string; // Para eventos recorrentes modificados

  // Lista de tarefas
  @Prop({ type: [Task], default: [] })
  tasks!: Task[];
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
