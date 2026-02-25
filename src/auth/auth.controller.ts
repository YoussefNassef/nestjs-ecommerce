import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './providers/auth.service';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { SignInDto } from './dtos/signIn-dto';
import { Auth } from './decorator/auth.decorator';
import { AuthType } from './enums/auth-type.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        message: 'User registered successfully',
        user: {
          id: 1,
          fullName: 'John Doe',
          phone: '966512345678',
          isVerified: false,
          role: 'user',
          createdAt: '2024-01-21T10:30:00Z',
          updatedAt: '2024-01-21T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('signIn')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Sign in with phone number' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    schema: {
      example: {
        message: 'OTP sent successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('verify-otp')
  @Auth(AuthType.None)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      example: {
        message: 'OTP verified successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          fullName: 'John Doe',
          phone: '966512345678',
          isVerified: true,
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid OTP code' })
  @ApiResponse({ status: 401, description: 'OTP expired or invalid' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }
}
