import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Role } from 'src/auth/enums/role.enum';
import { DashboardOverviewResponseDto } from './dtos/dashboard-overview-response.dto';
import { DashboardQueryDto } from './dtos/dashboard-query.dto';
import { AdminService } from './providers/admin.service';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Auth(AuthType.Bearer)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Trailing period length for analytics, from 1 to 90 days',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview retrieved successfully',
    type: DashboardOverviewResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  getOverview(@Query() query: DashboardQueryDto) {
    return this.adminService.getDashboardOverview(query);
  }
}
