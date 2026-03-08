import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { HealthService } from './providers/health.service';
import {
  HealthResponseDto,
  ReadinessResponseDto,
} from './dtos/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  getHealth() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Readiness probe (DB/Redis/providers)' })
  @ApiResponse({ status: 200, type: ReadinessResponseDto })
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
