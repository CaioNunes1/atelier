import { Module } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { AddressModule } from '../address/address.module';
import { CartModule } from '../cart/cart.module';
import { CouponModule } from '../coupon/coupon.module';
import { OrderCronService } from './order-cron.service';
import { AdminOrderController, OrderController } from './order.controller';
import { OrderNotificationService } from './order-notification.service';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
  imports: [AddressModule, CartModule, CouponModule],
  controllers: [OrderController, AdminOrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderNotificationService,
    OrderCronService,
    {
      provide: EventEmitter2,
      useFactory: () => new EventEmitter2(),
    },
  ],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
