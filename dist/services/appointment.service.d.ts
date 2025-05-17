import { Model } from "mongoose";
import * as mongoose from "mongoose";
import { Appointment, AppointmentDocument } from "../schemas/appointment.schema";
import { CreateAppointmentDto, TaskDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
type TaskCreate = Omit<TaskDto, "_id"> & {
    completed?: boolean;
};
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
export declare class AppointmentService {
    private appointmentModel;
    private readonly logger;
    constructor(appointmentModel: Model<AppointmentDocument>);
    create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment>;
    findAll(): Promise<Appointment[]>;
    findAllGroupedByTitle(startDateFilter?: string, endDateFilter?: string): Promise<GroupedAppointmentsResponse[]>;
    private calculateDuration;
    private formatDuration;
    findOne(id: string): Promise<Appointment | null>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment | null>;
    delete(id: string): Promise<Appointment | null>;
    addTask(appointmentId: string, taskData: TaskCreate): Promise<Appointment>;
    updateTask(appointmentId: string, taskId: string, updateData: any): Promise<mongoose.Document<unknown, {}, AppointmentDocument> & Appointment & mongoose.Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    removeTask(appointmentId: string, taskId: string): Promise<Appointment | null>;
}
export {};
