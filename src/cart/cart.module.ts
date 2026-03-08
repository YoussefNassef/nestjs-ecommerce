import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './providers/cart.service';
import { CartController } from './cart.controller';
import { Product } from 'src/products/products.entity';
import { RedisModule } from 'src/redis/redis.module';
import { AddToCartProvider } from './providers/add-to-cart.provider';
import { ApplyCouponProvider } from './providers/apply-coupon.provider';
import { ClearCartProvider } from './providers/clear-cart.provider';
import { GetMyCartProvider } from './providers/get-my-cart.provider';
import { RemoveCouponProvider } from './providers/remove-coupon.provider';
import { RemoveFromCartProvider } from './providers/remove-from-cart.provider';
import { UpdateCartItemProvider } from './providers/update-cart-item.provider';
import { CartStoreProvider } from './providers/cart-store.provider';
import { BuildCartResponseProvider } from './providers/build-cart-response.provider';
import { ValidateCartProvider } from './providers/validate-cart.provider';
import { CouponsModule } from 'src/coupons/coupons.module';

@Module({
  imports: [RedisModule, CouponsModule, TypeOrmModule.forFeature([Product])],
  controllers: [CartController],
  providers: [
    CartService,
    AddToCartProvider,
    ApplyCouponProvider,
    ClearCartProvider,
    GetMyCartProvider,
    RemoveCouponProvider,
    RemoveFromCartProvider,
    UpdateCartItemProvider,
    CartStoreProvider,
    BuildCartResponseProvider,
    ValidateCartProvider,
  ],
  exports: [CartService],
})
export class CartModule {}
