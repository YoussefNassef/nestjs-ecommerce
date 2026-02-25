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
} from '@nestjs/common';
import { CartService } from './providers/cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import * as activeUserDataInterface from 'src/auth/interface/active-user-data.interface';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';

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

  @Delete('item/:cartItemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Param('cartItemId') cartItemId: string,
  ) {
    return this.cartService.removeFromCart(user.sub, cartItemId);
  }

  @Patch('item/:cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(
    @ActiveUser() user: activeUserDataInterface.ActiveUserData,
    @Param('cartItemId') cartItemId: string,
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
  async clearCart(@ActiveUser() user: activeUserDataInterface.ActiveUserData) {
    return this.cartService.clearCart(user.sub);
  }
}
