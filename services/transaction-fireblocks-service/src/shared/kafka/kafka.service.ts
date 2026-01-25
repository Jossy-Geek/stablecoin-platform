import { Injectable, Inject, OnModuleInit, Logger, Optional } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private isConnected: boolean = false;

  constructor(
    @Inject('KAFKA_SERVICE') @Optional() private readonly kafkaClient: ClientKafka | null,
    private configService: ConfigService,
  ) {
    if (!this.kafkaClient) {
      this.logger.warn('⚠️  Kafka client is not available. Kafka operations will be skipped.');
    }
  }

  async onModuleInit() {
    if (!this.kafkaClient) {
      this.logger.warn('⚠️  Skipping Kafka connection (client not available)');
      return;
    }

    try {
      await Promise.race([
        this.kafkaClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Kafka connection timeout')), 10000),
        ),
      ]);
      this.isConnected = true;
      this.logger.log('✅ Kafka client connected');
    } catch (error) {
      this.logger.warn(`⚠️  Failed to connect to Kafka: ${error.message}`);
      this.logger.warn('⚠️  Service will continue without Kafka. Event publishing will be skipped.');
      this.isConnected = false;
    }
  }

  async emit(topic: string, data: any): Promise<void> {
    if (!this.kafkaClient || !this.isConnected) {
      this.logger.debug(`Kafka emit skipped (Kafka not available): ${topic}`);
      return;
    }

    try {
      this.kafkaClient.emit(topic, data);
      this.logger.debug(`Message emitted to topic: ${topic}`);
    } catch (error) {
      this.logger.warn(`Failed to emit message to topic ${topic}: ${error.message}`);
      // Don't throw - fail gracefully
    }
  }

  async send(topic: string, data: any): Promise<any> {
    if (!this.kafkaClient || !this.isConnected) {
      this.logger.debug(`Kafka send skipped (Kafka not available): ${topic}`);
      return null;
    }

    try {
      return await this.kafkaClient.send(topic, data).toPromise();
    } catch (error) {
      this.logger.warn(`Failed to send message to topic ${topic}: ${error.message}`);
      return null;
    }
  }
}
