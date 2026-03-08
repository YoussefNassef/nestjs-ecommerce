import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { Roles } from 'src/auth/decorator/role.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Role } from 'src/auth/enums/role.enum';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import { CreateReturnRequestDto } from './dtos/create-return-request.dto';
import { ListReturnRequestsQueryDto } from './dtos/list-return-requests-query.dto';
import { ReturnRequestResponseDto } from './dtos/return-request-response.dto';
import { UpdateReturnRequestStatusDto } from './dtos/update-return-request-status.dto';
import { ReturnsService } from './providers/returns.service';

@ApiTags('returns')
@ApiBearerAuth('JWT-auth')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Create return request for a delivered order' })
  @ApiBody({ type: CreateReturnRequestDto })
  @ApiResponse({ status: 201, type: ReturnRequestResponseDto })
  create(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return this.returnsService.createReturnRequest(user, dto);
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Get my return requests' })
  @ApiResponse({ status: 200, type: [ReturnRequestResponseDto] })
  findMy(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.returnsService.getMyReturnRequests(user);
  }

  @Patch(':id/cancel')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Cancel my requested return' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, type: ReturnRequestResponseDto })
  cancelMine(
    @Param('id', new ParseUUIDPipe()) id: string,
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.returnsService.cancelMyReturnRequest(id, user);
  }

  @Get()
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List return requests (admin)' })
  @ApiResponse({ status: 200, type: [ReturnRequestResponseDto] })
  findAll(@Query() query: ListReturnRequestsQueryDto) {
    return this.returnsService.getAllReturnRequests(query);
  }

  @Patch(':id/status')
  @Auth(AuthType.Bearer)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update return request status (admin)' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: UpdateReturnRequestStatusDto })
  @ApiResponse({ status: 200, type: ReturnRequestResponseDto })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReturnRequestStatusDto,
    @ActiveUser() admin: activeUserDataInterface.ActiveUserData,
  ) {
    return this.returnsService.updateReturnRequestStatus(id, dto, admin);
  }
}
