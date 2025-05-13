// create-appointment.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";

class TaskDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty({ message: "O título não pode estar vazio" })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: "A data de início não pode estar vazia" })
  start!: string;

  @IsString()
  @IsNotEmpty({ message: "A data de término não pode estar vazia" })
  end!: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @ValidateIf((o) => o.isRecurring === true)
  @IsNotEmpty({
    message: "Recurrence rule is required for recurring appointments",
  })
  recurrenceRule?: string;

  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  @IsOptional()
  tasks?: TaskDto[];
}
