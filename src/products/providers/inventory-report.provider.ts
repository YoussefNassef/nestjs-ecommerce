import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductStockMovement } from '../product-stock-movement.entity';
import { Repository } from 'typeorm';

export interface DailyInventoryMovement {
  date: string;
  inMovement: number;
  outMovement: number;
  netMovement: number;
  adjustmentsCount: number;
}

export interface InventoryReportResult {
  days: number;
  startDate: string;
  endDate: string;
  totals: {
    inMovement: number;
    outMovement: number;
    netMovement: number;
    adjustmentsCount: number;
  };
  series: DailyInventoryMovement[];
}

@Injectable()
export class InventoryReportProvider {
  constructor(
    @InjectRepository(ProductStockMovement)
    private readonly movementRepo: Repository<ProductStockMovement>,
  ) {}

  async getDailyMovementReport(days = 30): Promise<InventoryReportResult> {
    const endDate = new Date();
    const endDayUtc = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const startDayUtc = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate() - (days - 1),
        0,
        0,
        0,
        0,
      ),
    );

    const rows = await this.movementRepo
      .createQueryBuilder('movement')
      .select("TO_CHAR(DATE(movement.createdAt), 'YYYY-MM-DD')", 'day')
      .addSelect(
        'COALESCE(SUM(CASE WHEN movement.delta > 0 THEN movement.delta ELSE 0 END), 0)',
        'inMovement',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN movement.delta < 0 THEN ABS(movement.delta) ELSE 0 END), 0)',
        'outMovement',
      )
      .addSelect('COALESCE(SUM(movement.delta), 0)', 'netMovement')
      .addSelect('COUNT(*)', 'adjustmentsCount')
      .where('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDayUtc,
        endDate: endDayUtc,
      })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{
        day: string;
        inMovement: string;
        outMovement: string;
        netMovement: string;
        adjustmentsCount: string;
      }>();

    const rowByDay = new Map(rows.map((r) => [r.day, r]));
    const series: DailyInventoryMovement[] = Array.from(
      { length: days },
      (_, index) => {
        const date = new Date(startDayUtc);
        date.setUTCDate(startDayUtc.getUTCDate() + index);
        const day = date.toISOString().slice(0, 10);
        const row = rowByDay.get(day);

        return {
          date: day,
          inMovement: Number(row?.inMovement ?? 0),
          outMovement: Number(row?.outMovement ?? 0),
          netMovement: Number(row?.netMovement ?? 0),
          adjustmentsCount: Number(row?.adjustmentsCount ?? 0),
        };
      },
    );

    const totals = series.reduce(
      (acc, day) => {
        acc.inMovement += day.inMovement;
        acc.outMovement += day.outMovement;
        acc.netMovement += day.netMovement;
        acc.adjustmentsCount += day.adjustmentsCount;
        return acc;
      },
      {
        inMovement: 0,
        outMovement: 0,
        netMovement: 0,
        adjustmentsCount: 0,
      },
    );

    return {
      days,
      startDate: startDayUtc.toISOString(),
      endDate: endDayUtc.toISOString(),
      totals,
      series,
    };
  }
}

