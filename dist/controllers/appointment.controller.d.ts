import { AppointmentService } from "../services/appointment.service";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import { Appointment, AppointmentDocument } from "../schemas/appointment.schema";
import * as mongoose from "mongoose";
export declare class AppointmentController {
    private readonly appointmentService;
    constructor(appointmentService: AppointmentService);
    create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment>;
    findAll(): Promise<Appointment[]>;
    findAllGroupedByTitle(startDate?: string, endDate?: string): Promise<import("../services/appointment.service").GroupedAppointmentsResponse[]>;
    findOne(id: string): Promise<Appointment>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment>;
    delete(id: string): Promise<{
        message: string;
    }>;
    addTask(id: string, task: {
        description: string;
        completed?: boolean;
    }): Promise<Appointment>;
    updateTask(appointmentId: string, taskId: string, updateData: {
        completed: boolean;
    }): Promise<mongoose.Document<unknown, {}, AppointmentDocument> & Appointment & mongoose.Document<unknown, any, any> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    removeTask(id: string, taskId: string): Promise<Appointment>;
}
