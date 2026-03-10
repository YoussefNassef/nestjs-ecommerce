import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductsService } from './providers/products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Product } from './products.entity';
import { ProductImagesInterceptor } from './interceptors/product-images.interceptor';
import { UploadedImageFile } from './types/uploaded-image-file.type';
import {
  ProductListQueryDto,
  ProductSortBy,
  SortOrder,
} from './dtos/product-list-query.dto';
import { AdjustProductStockDto } from './dtos/adjust-product-stock.dto';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { ListProductStockMovementsQueryDto } from './dtos/list-product-stock-movements-query.dto';
import { ProductStockMovement } from './product-stock-movement.entity';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { UpdateProductCommercialDto } from './dtos/update-product-commercial.dto';
import type { LowStockAlertSummary } from './providers/notify-low-stock.provider';
import { InventoryReportQueryDto } from './dtos/inventory-report-query.dto';
import type { InventoryReportResult } from './providers/inventory-report.provider';
import type { StockReconciliationResult } from './providers/stock-reconciliation-checker.provider';
import type { StockReconciliationFixResult } from './providers/stock-reconciliation-checker.provider';

@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'name',
        'slug',
        'sku',
        'price',
        'stock',
        'categoryId',
        'mainPicture',
        'subPictures',
      ],
      properties: {
        name: { type: 'string', example: 'iPhone 15 Pro' },
        slug: { type: 'string', example: 'iphone-15-pro' },
        sku: { type: 'string', example: 'IPH15PRO-256-BLK' },
        price: { type: 'number', example: 4999.99 },
        stock: { type: 'number', example: 25 },
        isActive: { type: 'boolean', example: true },
        categoryId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
        description: {
          type: 'string',
          example: 'Latest iPhone with advanced features',
        },
        mainPicture: { type: 'string', format: 'binary' },
        subPictures: {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @UseInterceptors(ProductImagesInterceptor)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      mainPicture?: UploadedImageFile[];
      subPictures?: UploadedImageFile[];
    },
  ) {
    return this.productService.createProductWithImages(createProductDto, files);
  }

  @Get()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, example: 'iphone' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiQuery({ name: 'categorySlug', required: false, example: 'smartphones' })
  @ApiQuery({ name: 'minPrice', required: false, example: 500 })
  @ApiQuery({ name: 'maxPrice', required: false, example: 5000 })
  @ApiQuery({ name: 'isActive', required: false, example: true })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ProductSortBy,
    example: ProductSortBy.PRICE,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @ApiResponse({
    status: 200,
    description: 'List of all products',
    type: [Product],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getProduct(@Query() query: ProductListQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('inventory/report')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get daily inventory movement report (in/out/net)' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Trailing days window',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory report generated successfully',
  })
  getInventoryReport(
    @Query() query: InventoryReportQueryDto,
  ): Promise<InventoryReportResult> {
    return this.productService.getInventoryDailyReport(query.days ?? 30);
  }

  @Get('inventory/reconciliation')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Run inventory reconciliation checker' })
  @ApiQuery({
    name: 'notify',
    required: false,
    description: 'Notify admins when anomalies are detected',
    example: false,
  })
  @ApiQuery({
    name: 'forceNotify',
    required: false,
    description: 'Ignore notification cooldown and force notification send',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation result returned successfully',
  })
  runInventoryReconciliation(
    @Query('notify', new DefaultValuePipe(false), ParseBoolPipe) notify: boolean,
    @Query('forceNotify', new DefaultValuePipe(false), ParseBoolPipe)
    forceNotify: boolean,
  ): Promise<StockReconciliationResult> {
    return this.productService.runStockReconciliation(notify, forceNotify);
  }

  @Post('inventory/reconciliation/fix')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Auto-fix reserved stock mismatches (dryRun by default, non-destructive)',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    description: 'When true, only preview fixes without applying changes',
    example: true,
  })
  @ApiQuery({
    name: 'forceNotify',
    required: false,
    description: 'Ignore cooldown and force admin notification',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Reconciliation auto-fix result',
  })
  fixInventoryReconciliation(
    @Query('dryRun', new DefaultValuePipe(true), ParseBoolPipe) dryRun: boolean,
    @Query('forceNotify', new DefaultValuePipe(false), ParseBoolPipe)
    forceNotify: boolean,
  ): Promise<StockReconciliationFixResult> {
    return this.productService.fixStockReconciliationMismatch(
      dryRun,
      forceNotify,
    );
  }

  @Get(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product found',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getOneProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: Product,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Patch(':id/commercial')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update product commercial data (name/price)' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateProductCommercialDto })
  @ApiResponse({
    status: 200,
    description: 'Product commercial data updated successfully',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'At least one field is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateCommercial(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductCommercialDto,
  ) {
    return this.productService.updateCommercial(id, dto);
  }

  @Post(':id/stock-adjustments')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Adjust product stock with audit trail entry' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: AdjustProductStockDto })
  @ApiResponse({
    status: 200,
    description: 'Product stock adjusted successfully',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Invalid stock adjustment request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async adjustStock(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdjustProductStockDto,
    @ActiveUser() admin: ActiveUserData,
  ) {
    return this.productService.adjustStock(id, dto, admin);
  }

  @Get(':id/stock-adjustments')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List product stock adjustment history' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock adjustment history retrieved successfully',
    type: ProductStockMovement,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async listStockAdjustments(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: ListProductStockMovementsQueryDto,
  ): Promise<PaginatedResponse<ProductStockMovement>> {
    return this.productService.listStockMovements(id, query);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productService.remove(id);
  }

  @Post('alerts/low-stock')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Trigger low-stock admin alerts' })
  @ApiQuery({
    name: 'force',
    required: false,
    description: 'Ignore cooldown and force-send notifications',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Low-stock alert execution summary',
  })
  triggerLowStockAlerts(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
  ): Promise<LowStockAlertSummary> {
    return this.productService.triggerLowStockAlerts(force);
  }
}
