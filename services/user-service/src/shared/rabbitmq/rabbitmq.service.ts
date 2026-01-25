import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly serviceName: string;

  constructor(
    @Inject('RABBITMQ_CONNECTION') private connection: amqp.Connection | null,
    private configService: ConfigService,
  ) {
    this.serviceName = this.configService.get('SERVICE_NAME', 'user-service');
  }

  private isRabbitMQAvailable(): boolean {
    return this.connection !== null;
  }

  async publish(queue: string, message: any): Promise<void> {
    if (!this.isRabbitMQAvailable()) {
      this.logger.debug(`[${this.serviceName}] RabbitMQ not available, skipping publish to queue: ${queue}`);
      return;
    }

    let channel: amqp.Channel | null = null;
    try {
      channel = await (this.connection as any).createChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
      this.logger.debug(`[${this.serviceName}] ✅ Message published to queue: ${queue}`);
    } catch (error: any) {
      this.logger.error(`[${this.serviceName}] ❌ RabbitMQ publish error to queue "${queue}": ${error.message}`);
      throw error;
    } finally {
      if (channel) {
        try {
          await channel.close();
        } catch (error: any) {
          this.logger.error(`[${this.serviceName}] Error closing channel: ${error.message}`);
        }
      }
    }
  }

  async consume(queue: string, callback: (message: any) => Promise<void>): Promise<void> {
    if (!this.isRabbitMQAvailable()) {
      this.logger.debug(`[${this.serviceName}] RabbitMQ not available, skipping consume from queue: ${queue}`);
      return;
    }

    try {
      const channel = await (this.connection as any).createChannel();
      await channel.assertQueue(queue, { durable: true });
      
      this.logger.log(`[${this.serviceName}] ✅ Consuming messages from queue: ${queue}`);
      
      channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await callback(content);
            channel.ack(msg);
          } catch (error: any) {
            this.logger.error(`[${this.serviceName}] ❌ Error processing message from queue "${queue}": ${error.message}`);
            channel.nack(msg, false, false); // Reject and don't requeue
          }
        }
      });
    } catch (error: any) {
      this.logger.error(`[${this.serviceName}] ❌ RabbitMQ consume error from queue "${queue}": ${error.message}`);
      throw error;
    }
  }
}
