import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UsersService } from './providers/users.service';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { RequestPhoneChangeDto } from './dtos/request-phone-change.dto';
import { VerifyPhoneChangeDto } from './dtos/verify-phone-change.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(
    @ActiveUser() activeUser: ActiveUserData,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.getCurrentUser(activeUser);
    return this.mapToUserProfile(user);
  }

  @Patch('me')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Current user profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate phone' })
  async updateMe(
    @ActiveUser() activeUser: ActiveUserData,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const updatedUser = await this.usersService.updateCurrentUser(
      activeUser,
      dto,
    );
    return this.mapToUserProfile(updatedUser);
  }

  @Post('me/phone-change/request')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Request phone change OTP for current user' })
  @ApiBody({ type: RequestPhoneChangeDto })
  @ApiResponse({
    status: 201,
    description: 'OTP sent to new phone number',
    schema: { example: { message: 'OTP sent to new phone number' } },
  })
  requestPhoneChange(
    @ActiveUser() activeUser: ActiveUserData,
    @Body() dto: RequestPhoneChangeDto,
  ) {
    return this.usersService.requestPhoneChange(activeUser, dto);
  }

  @Post('me/phone-change/verify')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Verify OTP and apply phone change' })
  @ApiBody({ type: VerifyPhoneChangeDto })
  @ApiResponse({
    status: 201,
    description: 'Phone number updated successfully',
    type: UserProfileDto,
  })
  async verifyPhoneChange(
    @ActiveUser() activeUser: ActiveUserData,
    @Body() dto: VerifyPhoneChangeDto,
  ): Promise<UserProfileDto> {
    const updatedUser = await this.usersService.verifyPhoneChange(
      activeUser,
      dto,
    );
    return this.mapToUserProfile(updatedUser);
  }

  private mapToUserProfile(user: {
    id: number;
    fullName: string;
    phone: string;
    isVerified: boolean;
    role: UserProfileDto['role'];
    createdAt: Date;
    updatedAt: Date;
  }): UserProfileDto {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
