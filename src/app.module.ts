import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketsModule } from './tickets/tickets.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [PrismaModule, QueueModule, TicketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
