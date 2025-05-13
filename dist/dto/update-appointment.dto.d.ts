declare class TaskDto {
    description?: string;
    completed?: boolean;
}
export declare class UpdateAppointmentDto {
    title?: string;
    start?: string;
    end?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    originalStart?: string;
    tasks?: TaskDto[];
}
export {};
