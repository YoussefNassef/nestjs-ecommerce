import { Injectable } from '@nestjs/common';
import { DashboardOverviewResponseDto } from '../dtos/dashboard-overview-response.dto';
import { DashboardQueryDto } from '../dtos/dashboard-query.dto';
import { GetDashboardOverviewProvider } from './get-dashboard-overview.provider';

@Injectable()
export class AdminService {
  constructor(
    private readonly getDashboardOverviewProvider: GetDashboardOverviewProvider,
  ) {}

  async getDashboardOverview(
    query: DashboardQueryDto,
  ): Promise<DashboardOverviewResponseDto> {
    return this.getDashboardOverviewProvider.getOverview(query);
  }
}
