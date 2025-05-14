import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  start!: string;

  @Prop({ required: true })
  end!: string;

  @Prop({ default: false })
  isRecurring!: boolean;

  @Prop()
  recurrenceRule?: string;

  @Prop()
  recurrenceId?: string;

  @Prop()
  originalStart?: string;

  @Prop({
    type: [
      {
        _id: { type: Types.ObjectId, auto: true },
        description: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  tasks!: Array<{
    _id?: Types.ObjectId;
    description: string;
    completed: boolean;
  }>;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
