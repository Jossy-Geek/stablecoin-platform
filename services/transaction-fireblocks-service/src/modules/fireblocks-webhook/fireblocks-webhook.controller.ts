import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VaultWebhookService } from './fireblocks-webhook.service';

@ApiTags('Vault Webhook')
@Controller('webhooks/vault')
export class VaultWebhookController {
  private readonly logger = new Logger(VaultWebhookController.name);

  constructor(private readonly webhookService: VaultWebhookService) {}

  @Post('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vault webhook endpoint' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('vault-signature') signature: string,
  ) {
    this.logger.log(`Received vault webhook: ${payload.type}`);

    const isValid = await this.webhookService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      return { status: 'error', message: 'Invalid signature' };
    }

    await this.webhookService.processWebhookEvent(payload);
    return { status: 'ok' };
  }
}
