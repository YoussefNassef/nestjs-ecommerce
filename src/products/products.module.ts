import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './providers/products.service';
import { Product } from './products.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateProductProvider } from './providers/create-product.provider';
import { FindAllProvider } from './providers/find-all.provider';
import { FindOneProvider } from './providers/find-one.provider';
import { UpdateProvider } from './providers/update.provider';
import { RemoveProvider } from './providers/remove.provider';
import { Category } from 'src/categories/category.entity';
import { AdjustStockProvider } from './providers/adjust-stock.provider';
import { ListStockMovementsProvider } from './providers/list-stock-movements.provider';
import { ProductStockMovement } from './product-stock-movement.entity';
import { UpdateProductCommercialProvider } from './providers/update-product-commercial.provider';
import { NotifyLowStockProvider } from './providers/notify-low-stock.provider';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { InventoryReportProvider } from './providers/inventory-report.provider';
import { StockReconciliationCheckerProvider } from './providers/stock-reconciliation-checker.provider';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    CreateProductProvider,
    FindAllProvider,
    FindOneProvider,
    UpdateProvider,
    RemoveProvider,
    AdjustStockProvider,
    ListStockMovementsProvider,
    UpdateProductCommercialProvider,
    NotifyLowStockProvider,
    InventoryReportProvider,
    StockReconciliationCheckerProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([Product, Category, ProductStockMovement]),
    NotificationsModule,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
