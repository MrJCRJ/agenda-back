import { Model } from "mongoose";
import { Appointment, AppointmentDocument } from "../schemas/appointment.schema";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
export declare class AppointmentService {
    private appointmentModel;
    constructor(appointmentModel: Model<AppointmentDocument>);
    create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment>;
    private createRecurringAppointments;
    private calculateEndDate;
    findAll(): Promise<Appointment[]>;
    findOne(id: string): Promise<Appointment | null>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment | null>;
    private handleRecurringUpdate;
    delete(id: string): Promise<Appointment | null>;
    addTask(appointmentId: string, task: {
        description: string;
        completed?: boolean;
    }): Promise<Appointment | null>;
    updateTask(appointmentId: string, taskId: string, update: {
        description?: string;
        completed?: boolean;
    }): Promise<Appointment | null>;
    removeTask(appointmentId: string, taskId: string): Promise<Appointment | null>;
}
