import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CartService } from './providers/cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { ApplyCouponDto } from 'src/coupons/dtos/apply-coupon.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { ValidateCartResponseDto } from './dtos/validate-cart-response.dto';

@ApiTags('Cart')
@Controller('cart')
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @Auth(AuthType.Bearer)
  async getCart(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.cartService.getCart(user.sub);
  }

  @Post('add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add product to cart' })
  @Auth(AuthType.Bearer)
  async addToCart(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(user.sub, addToCartDto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate current user cart before checkout' })
  @ApiResponse({
    status: 200,
    description: 'Cart validation result',
    type: ValidateCartResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth(AuthType.Bearer)
  async validateCart(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
  ) {
    return this.cartService.validateCart(user.sub);
  }

  @Post('coupon/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply coupon code to current cart' })
  @Auth(AuthType.Bearer)
  applyCoupon(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.cartService.applyCoupon(user.sub, dto);
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove applied coupon from current cart' })
  @Auth(AuthType.Bearer)
  removeCoupon(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.cartService.removeCoupon(user.sub);
  }

  @Delete('item/:cartItemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @Auth(AuthType.Bearer)
  async removeFromCart(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Param('cartItemId', new ParseUUIDPipe()) cartItemId: string,
  ) {
    return this.cartService.removeFromCart(user.sub, cartItemId);
  }

  @Patch('item/:cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @Auth(AuthType.Bearer)
  async updateCartItem(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Param('cartItemId', new ParseUUIDPipe()) cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      user.sub,
      cartItemId,
      updateCartItemDto,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @Auth(AuthType.Bearer)
  async clearCart(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.cartService.clearCart(user.sub);
  }
}
