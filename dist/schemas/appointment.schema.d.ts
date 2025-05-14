import { Document, Types } from "mongoose";
export type AppointmentDocument = Appointment & Document;
export declare class Appointment {
    title: string;
    start: string;
    end: string;
    isRecurring: boolean;
    recurrenceRule?: string;
    recurrenceId?: string;
    originalStart?: string;
    tasks: Array<{
        _id?: Types.ObjectId;
        description: string;
        completed: boolean;
    }>;
}
export declare const AppointmentSchema: import("mongoose").Schema<Appointment, import("mongoose").Model<Appointment, any, any, any, Document<unknown, any, Appointment> & Appointment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Appointment, Document<unknown, {}, import("mongoose").FlatRecord<Appointment>> & import("mongoose").FlatRecord<Appointment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
