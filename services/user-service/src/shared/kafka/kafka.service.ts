import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export interface RetryMessage {
  originalTopic: string;
  data: any;
  retryCount: number;
  error?: string;
  timestamp: string;
}

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private retryTopic: string;
  private dlqTopic: string;
  private maxRetries: number;

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private configService: ConfigService,
  ) {
    this.retryTopic = this.configService.get('KAFKA_RETRY_TOPIC', 'user-retry');
    this.dlqTopic = this.configService.get('KAFKA_DLQ_TOPIC', 'user-dlq');
    this.maxRetries = parseInt(this.configService.get('KAFKA_MAX_RETRIES', '3'), 10);
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('Kafka client connected');
  }

  async emit(topic: string, data: any): Promise<void> {
    try {
      this.kafkaClient.emit(topic, data);
      this.logger.debug(`Message emitted to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to emit message to topic ${topic}:`, error);
      throw error;
    }
  }

  async send(topic: string, data: any): Promise<any> {
    try {
      return await this.kafkaClient.send(topic, data).toPromise();
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}:`, error);
      throw error;
    }
  }

  async emitWithRetry(
    topic: string,
    data: any,
    retryCount: number = 0,
  ): Promise<void> {
    try {
      await this.emit(topic, data);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const retryMessage: RetryMessage = {
          originalTopic: topic,
          data,
          retryCount: retryCount + 1,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        this.logger.warn(
          `Retrying message to ${topic} (attempt ${retryCount + 1}/${this.maxRetries})`,
        );
        await this.emit(this.retryTopic, retryMessage);
      } else {
        const dlqMessage: RetryMessage = {
          originalTopic: topic,
          data,
          retryCount,
          error: `Max retries exceeded: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
        this.logger.error(
          `Max retries exceeded for topic ${topic}, moving to DLQ`,
        );
        await this.emit(this.dlqTopic, dlqMessage);
      }
    }
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }
}
