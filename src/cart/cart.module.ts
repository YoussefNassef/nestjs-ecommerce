import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './providers/cart.service';
import { CartController } from './cart.controller';
import { Cart } from './entities/cart.entity';
import { Product } from 'src/products/products.entity';
import { ProductsModule } from 'src/products/products.module';
import { GetMyCartProvider } from './providers/get-my-cart.provider';
import { AddToCartProvider } from './providers/add-to-cart.provider';
import { UpdateCartItemProvider } from './providers/update-cart-item.provider';
import { ClearCartProvider } from './providers/clear-cart.provider';
import { RemoveFromCartProvider } from './providers/remove-from-cart.provider';
import { GetCartItemProvider } from './providers/get-cart-item.provider';
import { CartItem } from './entities/cart-item.entity';

@Module({
  imports: [
    ProductsModule,
    TypeOrmModule.forFeature([Cart, CartItem, Product]),
  ],
  controllers: [CartController],
  providers: [
    CartService,
    GetMyCartProvider,
    AddToCartProvider,
    UpdateCartItemProvider,
    ClearCartProvider,
    RemoveFromCartProvider,
    GetCartItemProvider,
  ],
  exports: [CartService],
})
export class CartModule {}
