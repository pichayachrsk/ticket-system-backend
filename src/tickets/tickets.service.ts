import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  defaultPage,
  defaultPageSize,
  SortOrder,
  Priority,
  Status,
} from './interfaces/ticket.interface';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async createTicket(dto: CreateTicketDto) {
    try {
      const response = await this.prismaService.ticket.create({
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority ?? Priority.MEDIUM,
          status: dto.status ?? Status.OPEN,
        },
      });

      try {
        await this.queueService.addTicketNotify(response.id);
        await this.queueService.addTicketSla(response.id);
      } catch (error) {
        console.warn('Error during enqueue ticket job', error);
      }

      return response;
    } catch (error) {
      throw new InternalServerErrorException(
        'The server was unable to complete your request. Please try again later.',
      );
    }
  }

  async getTickets(query: {
    priority?: string;
    status?: string;
    search?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
  }) {
    const where: Prisma.TicketWhereInput = {};

    if (query.status) {
      where.status = <Status>query.status;
    }

    if (query.priority) {
      where.priority = <Priority>query.priority;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const page = query.page ? parseInt(query.page) : defaultPage;
    const pageSize = query.pageSize
      ? parseInt(query.pageSize)
      : defaultPageSize;
    const skip = (page - 1) * pageSize;

    const orderBy: Prisma.TicketOrderByWithRelationInput = {};
    query.sortBy
      ? (orderBy[query.sortBy] = query.sortOrder ?? 'desc')
      : (orderBy['createdAt'] = 'desc');

    try {
      const [numberOfTickets, tickets] = await Promise.all([
        this.prismaService.ticket.count({ where }),
        this.prismaService.ticket.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
        }),
      ]);

      return { numberOfTickets, tickets, page, pageSize };
    } catch (error) {
      throw new InternalServerErrorException(
        'The server was unable to complete your request. Please try again later.',
        error,
      );
    }
  }

  async getTicketById(id: number) {
    try {
      const response = await this.prismaService.ticket.findUnique({
        where: { id },
      });

      if (!response) throw new NotFoundException('Ticket was not found');

      return response;
    } catch (error) {
      throw new InternalServerErrorException(
        'The server was unable to complete your request. Please try again later.',
        error,
      );
    }
  }

  async updateTicket(id: number, dto: UpdateTicketDto) {
    try {
      const data: Prisma.TicketUpdateInput = {};

      if (dto.title) {
        data.title = dto.title;
      }

      if (dto.description) {
        data.description = dto.description;
      }

      if (dto.priority) {
        data.priority = dto.priority;
      }

      if (dto.status) {
        data.status = dto.status;
      }

      const response = await this.prismaService.ticket.update({
        where: { id },
        data,
      });

      if (dto.status === Status.RESOLVED) {
        try {
          await this.queueService.removeTicketSla(id);
        } catch (error) {
          console.warn('Failed to remove SLA job', error);
        }
      }
      return response;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Ticket was not found', error);
      }
      throw new InternalServerErrorException(
        'The server was unable to complete your request. Please try again later.',
        error,
      );
    }
  }

  async removeTicket(id: number) {
    try {
      await this.prismaService.ticket.delete({ where: { id } });
      return { message: 'Ticket successfully deleted.' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Ticket was not found', error);
      }
      throw new InternalServerErrorException(
        'The server was unable to complete your request. Please try again later.',
        error
      );
    }
  }
}
