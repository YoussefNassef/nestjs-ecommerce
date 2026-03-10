import { Injectable } from '@nestjs/common';
import { Product } from '../products.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { CreateProductProvider } from './create-product.provider';
import { FindAllProvider } from './find-all.provider';
import { FindOneProvider } from './find-one.provider';
import { UpdateProvider } from './update.provider';
import { RemoveProvider } from './remove.provider';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { UploadedImageFile } from '../types/uploaded-image-file.type';
import { ProductListQueryDto } from '../dtos/product-list-query.dto';
import { AdjustStockProvider } from './adjust-stock.provider';
import { AdjustProductStockDto } from '../dtos/adjust-product-stock.dto';
import { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { ListStockMovementsProvider } from './list-stock-movements.provider';
import { ListProductStockMovementsQueryDto } from '../dtos/list-product-stock-movements-query.dto';
import { ProductStockMovement } from '../product-stock-movement.entity';
import { UpdateProductCommercialProvider } from './update-product-commercial.provider';
import { UpdateProductCommercialDto } from '../dtos/update-product-commercial.dto';
import { NotifyLowStockProvider } from './notify-low-stock.provider';
import type { LowStockAlertSummary } from './notify-low-stock.provider';
import { InventoryReportProvider } from './inventory-report.provider';
import type { InventoryReportResult } from './inventory-report.provider';
import { StockReconciliationCheckerProvider } from './stock-reconciliation-checker.provider';
import type { StockReconciliationResult } from './stock-reconciliation-checker.provider';
import type { StockReconciliationFixResult } from './stock-reconciliation-checker.provider';

@Injectable()
export class ProductsService {
  constructor(
    private readonly createProductProvider: CreateProductProvider,
    private readonly findAllProvider: FindAllProvider,
    private readonly findOneProvider: FindOneProvider,
    private readonly updateProvider: UpdateProvider,
    private readonly removeProvider: RemoveProvider,
    private readonly adjustStockProvider: AdjustStockProvider,
    private readonly listStockMovementsProvider: ListStockMovementsProvider,
    private readonly updateProductCommercialProvider: UpdateProductCommercialProvider,
    private readonly notifyLowStockProvider: NotifyLowStockProvider,
    private readonly inventoryReportProvider: InventoryReportProvider,
    private readonly stockReconciliationCheckerProvider: StockReconciliationCheckerProvider,
  ) {}

  async createProductWithImages(
    dto: CreateProductDto,
    files: {
      mainPicture?: UploadedImageFile[];
      subPictures?: UploadedImageFile[];
    },
  ): Promise<Product> {
    return this.createProductProvider.createWithImages(dto, files);
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    return this.createProductProvider.create(dto);
  }

  async findAll(
    query: ProductListQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.findAllProvider.findAll(query);
  }

  async findOne(id: string): Promise<Product> {
    return this.findOneProvider.findOne(id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    return this.updateProvider.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    return this.removeProvider.remove(id);
  }

  async adjustStock(
    id: string,
    dto: AdjustProductStockDto,
    admin: ActiveUserData,
  ): Promise<Product> {
    return this.adjustStockProvider.adjustStock(id, dto, admin);
  }

  async listStockMovements(
    id: string,
    query: ListProductStockMovementsQueryDto,
  ): Promise<PaginatedResponse<ProductStockMovement>> {
    return this.listStockMovementsProvider.list(id, query);
  }

  async updateCommercial(
    id: string,
    dto: UpdateProductCommercialDto,
  ): Promise<Product> {
    return this.updateProductCommercialProvider.update(id, dto);
  }

  async triggerLowStockAlerts(force = false): Promise<LowStockAlertSummary> {
    return this.notifyLowStockProvider.notifyLowStock(force);
  }

  async getInventoryDailyReport(days = 30): Promise<InventoryReportResult> {
    return this.inventoryReportProvider.getDailyMovementReport(days);
  }

  async runStockReconciliation(
    notifyAdmins = false,
    forceNotify = false,
  ): Promise<StockReconciliationResult> {
    return this.stockReconciliationCheckerProvider.runCheck(
      notifyAdmins,
      forceNotify,
    );
  }

  async fixStockReconciliationMismatch(
    dryRun = true,
    forceNotify = false,
  ): Promise<StockReconciliationFixResult> {
    return this.stockReconciliationCheckerProvider.fixReservedStockMismatch(
      dryRun,
      forceNotify,
    );
  }
}
