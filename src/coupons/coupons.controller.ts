import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { Roles } from 'src/auth/decorator/role.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Role } from 'src/auth/enums/role.enum';
import { Coupon } from './coupon.entity';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { CouponsService } from './providers/coupons.service';

@ApiTags('coupons')
@ApiBearerAuth('JWT-auth')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create coupon (admin)' })
  @ApiBody({ type: CreateCouponDto })
  @ApiResponse({ status: 201, type: Coupon })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List coupons (admin)' })
  @ApiResponse({ status: 200, type: [Coupon] })
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get coupon by id (admin)' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, type: Coupon })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update coupon (admin)' })
  @ApiBody({ type: UpdateCouponDto })
  @ApiResponse({ status: 200, type: Coupon })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete coupon (admin)' })
  @ApiResponse({ status: 200 })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.couponsService.remove(id);
  }
}
