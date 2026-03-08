import { ApiProperty } from '@nestjs/swagger';

class HealthChecksDto {
  @ApiProperty({ example: 'up' })
  db: 'up' | 'down';

  @ApiProperty({ example: 'up' })
  redis: 'up' | 'down';

  @ApiProperty({ example: 'up' })
  paymentsProvider: 'up' | 'down';
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: 'ok';

  @ApiProperty({ example: '2026-03-05T11:10:00.000Z' })
  timestamp: string;
}

export class ReadinessResponseDto extends HealthResponseDto {
  @ApiProperty({ type: () => HealthChecksDto })
  checks: HealthChecksDto;
}
