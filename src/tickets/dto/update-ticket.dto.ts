import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Priority, Status } from '../interfaces/ticket.interface';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
