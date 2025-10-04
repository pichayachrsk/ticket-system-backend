import { Controller, Get, Param } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueJobName } from './interfaces/queue.interface';

@Controller('admin/queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get(':name/stats')
  async stats(@Param('name') name: string) {
    return await this.queueService.getStats(name ?? QueueJobName.Tickets);
  }
}
