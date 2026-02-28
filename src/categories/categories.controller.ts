import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Role } from 'src/auth/enums/role.enum';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { CategoriesService } from './providers/categories.service';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: Category,
  })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [Category],
  })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.categoriesService.findAll(paginationQuery);
  }

  @Get(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: Category,
  })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: Category,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({
    name: 'id',
    description: 'Category UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
