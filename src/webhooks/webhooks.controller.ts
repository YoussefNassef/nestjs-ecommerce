import { Body, Controller, Post } from '@nestjs/common';
import { WebhooksService } from './providers/webhooks.service';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { MoyasarWebhookPayloadDto } from './dtos/webhookPayload.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Auth(AuthType.None)
  handle(@Body() payload: MoyasarWebhookPayloadDto) {
    return this.webhooksService.handleMoyasar(payload);
  }
}
