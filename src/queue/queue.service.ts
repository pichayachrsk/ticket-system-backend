import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import IORedis, { Redis } from 'ioredis';
import { QueueJobName } from './interfaces/queue.interface';

const REDIS_HOST = process.env.REDIS_HOST ?? '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6379', 10);
const ticketNotifyDelayTimes = 3000;
const ticketSlaDelayTimes = 15 * 60 * 1000;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: Redis;
  private queue: Queue;
  private worker: Worker;

  onModuleInit() {
    this.connection = new IORedis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue(QueueJobName.Tickets, {
      connection: this.connection,
    });

    this.worker = new Worker(
      QueueJobName.Tickets,
      async (job: Job) => this.onHandleJob(job),
      { connection: this.connection },
    );

    this.worker.on('failed', (job, error) => {
      job
        ? this.logger.warn(`Job failed ${job.id} ${job.name}: ${error.message}`)
        : this.logger.warn(`Job failed: ${error.message}`);
    });
  }

  async onHandleJob(job: Job) {
    switch (job.name) {
      case QueueJobName.TicketNotify:
        this.onTicketNotify(job.data.ticketId);
        break;
      case QueueJobName.TicketSla:
        this.onTicketSla(job.data.ticketId);
        break;
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.worker?.close();
      await this.queue?.close();
      await this.connection?.quit();
    } catch (error) {
      throw error('Error during Queue Service shutdown');
    }
  }

  async onTicketNotify(ticketId: number) {
    this.logger.log(`Mock notify for ticket id: ${ticketId}`);
  }

  async addTicketNotify(ticketId: number) {
    return this.queue.add(
      QueueJobName.TicketNotify,
      { ticketId },
      {
        jobId: `notify-${ticketId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: ticketNotifyDelayTimes,
        },
      },
    );
  }

  async onTicketSla(ticketId: number) {
    this.logger.log(`Mock SLA check for ticket id: ${ticketId}`);
  }

  async addTicketSla(ticketId: number) {
    return this.queue.add(
      QueueJobName.TicketSla,
      { ticketId },
      {
        jobId: `sla-${ticketId}`,
        delay: ticketSlaDelayTimes,
        attempts: 1,
      },
    );
  }

  async removeTicketSla(ticketId: number) {
    const jobId = `sla-${ticketId}`;
    const job = await this.queue.getJob(jobId);

    if (!job) return false;

    await job.remove();
    this.logger.log(`Removed SLA for job id${jobId}`);
    return true;
  }

  async getStats(name: string) {
    if (name === this.queue.name)
      return await this.queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      );

    const queue = new Queue(name, { connection: this.connection });
    try {
      return await queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      );
    } finally {
      await queue.close();
    }
  }
}
