import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { WebhooksService } from './providers/webhooks.service';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { MoyasarWebhookPayloadDto } from './dtos/webhookPayload.dto';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebhookProcessResponseDto } from './dtos/webhook-response.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Process payment provider webhook event' })
  @ApiResponse({ status: 201, type: WebhookProcessResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook payload/signature',
  })
  handle(
    @Req() req: Request & { rawBody?: string },
    @Headers('x-moyasar-signature') moyasarSignature: string | undefined,
    @Headers('x-signature') fallbackSignature: string | undefined,
    @Headers('x-idempotency-key') idempotencyKey: string | undefined,
    @Headers('x-event-id') eventId: string | undefined,
    @Body() payload: MoyasarWebhookPayloadDto,
  ) {
    this.webhooksService.verifyMoyasarSignature(
      req.rawBody ?? '',
      moyasarSignature ?? fallbackSignature,
    );
    return this.webhooksService.handleMoyasar(
      payload,
      idempotencyKey ?? eventId,
    );
  }
}
