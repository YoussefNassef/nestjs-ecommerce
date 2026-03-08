import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import type { ActiveUserData } from 'src/auth/interface/active-user-data.interface';
import { WishlistService } from './providers/wishlist.service';
import { Wishlist } from './wishlist.entity';

@ApiTags('wishlist')
@ApiBearerAuth('JWT-auth')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiResponse({ status: 200, type: [Wishlist] })
  getMyWishlist(@ActiveUser() user: ActiveUserData) {
    return this.wishlistService.getMyWishlist(user.sub);
  }

  @Post(':productId')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 201, type: Wishlist })
  addToWishlist(
    @ActiveUser() user: ActiveUserData,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.wishlistService.addToWishlist(user.sub, productId);
  }

  @Delete(':productId')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200 })
  removeFromWishlist(
    @ActiveUser() user: ActiveUserData,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(user.sub, productId);
  }

  @Post('move-to-cart/:productId')
  @Auth(AuthType.Bearer)
  @ApiOperation({ summary: 'Move product from wishlist to cart' })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200 })
  moveToCart(
    @ActiveUser() user: ActiveUserData,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.wishlistService.moveToCart(user.sub, productId);
  }
}
