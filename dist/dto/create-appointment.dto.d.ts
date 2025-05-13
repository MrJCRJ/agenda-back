declare class TaskDto {
    description: string;
    completed?: boolean;
}
export declare class CreateAppointmentDto {
    title: string;
    start: string;
    end: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    tasks?: TaskDto[];
}
export {};
