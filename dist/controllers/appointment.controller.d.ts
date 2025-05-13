import { AppointmentService } from "../services/appointment.service";
import { CreateAppointmentDto } from "../dto/create-appointment.dto";
import { UpdateAppointmentDto } from "../dto/update-appointment.dto";
import { Appointment } from "../schemas/appointment.schema";
export declare class AppointmentController {
    private readonly appointmentService;
    constructor(appointmentService: AppointmentService);
    create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment>;
    findAll(): Promise<Appointment[]>;
    findOne(id: string): Promise<Appointment>;
    update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment>;
    delete(id: string): Promise<{
        message: string;
    }>;
    addTask(id: string, task: {
        description: string;
        completed?: boolean;
    }): Promise<Appointment>;
    updateTask(id: string, taskId: string, update: {
        description?: string;
        completed?: boolean;
    }): Promise<Appointment>;
    removeTask(id: string, taskId: string): Promise<Appointment>;
}
