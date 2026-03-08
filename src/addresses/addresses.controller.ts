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
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { Address } from './address.entity';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { AddressesService } from './providers/addresses.service';

@ApiTags('addresses')
@ApiBearerAuth('JWT-auth')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Create shipping address' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, type: Address })
  create(@ActiveUser() user: ActiveUserData, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.sub, dto);
  }

  @Get()
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Get current user addresses' })
  @ApiResponse({ status: 200, type: [Address] })
  findAll(@ActiveUser() user: ActiveUserData) {
    return this.addressesService.findAll(user.sub);
  }

  @Patch(':id')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Update shipping address' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({ status: 200, type: Address })
  update(
    @ActiveUser() user: ActiveUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Delete shipping address' })
  @ApiResponse({ status: 200 })
  remove(
    @ActiveUser() user: ActiveUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.addressesService.remove(user.sub, id);
  }

  @Patch(':id/default')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Set default shipping address' })
  @ApiResponse({ status: 200, type: Address })
  setDefault(
    @ActiveUser() user: ActiveUserData,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.addressesService.setDefault(user.sub, id);
  }
}
