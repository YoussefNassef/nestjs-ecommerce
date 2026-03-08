import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/products.entity';
import { CartModule } from 'src/cart/cart.module';
import { WishlistController } from './wishlist.controller';
import { Wishlist } from './wishlist.entity';
import { AddToWishlistProvider } from './providers/add-to-wishlist.provider';
import { GetMyWishlistProvider } from './providers/get-my-wishlist.provider';
import { MoveToCartProvider } from './providers/move-to-cart.provider';
import { RemoveFromWishlistProvider } from './providers/remove-from-wishlist.provider';
import { WishlistService } from './providers/wishlist.service';

@Module({
  imports: [CartModule, TypeOrmModule.forFeature([Wishlist, Product])],
  controllers: [WishlistController],
  providers: [
    WishlistService,
    AddToWishlistProvider,
    GetMyWishlistProvider,
    RemoveFromWishlistProvider,
    MoveToCartProvider,
  ],
  exports: [WishlistService],
})
export class WishlistModule {}
