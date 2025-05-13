// update-appointment.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class TaskDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class UpdateAppointmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  start?: string;

  @IsString()
  @IsOptional()
  end?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @IsString()
  @IsOptional()
  originalStart?: string;

  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  @IsOptional()
  tasks?: TaskDto[];
}
