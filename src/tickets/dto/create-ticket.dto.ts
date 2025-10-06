import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Priority, Status } from '../interfaces/ticket.interface';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.OPEN;
}
