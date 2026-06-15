import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService, type CreateOrderParams } from './orders.service';

// Non-file multipart fields arrive as strings; coerce explicitly.
function toBool(v: unknown): boolean {
  return v === true || v === 'true' || v === '1' || v === 'on';
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, string>,
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('An STL file upload (field "file") is required');
    }
    if (!body.materialKey || !body.layerHeight || !body.finish) {
      throw new BadRequestException('materialKey, layerHeight and finish are required');
    }
    // NOTE: we deliberately ignore any client-sent amount/price/volume.
    const params: CreateOrderParams = {
      materialKey: body.materialKey as CreateOrderParams['materialKey'],
      layerHeight: body.layerHeight as CreateOrderParams['layerHeight'],
      finish: body.finish as CreateOrderParams['finish'],
      multicolor: toBool(body.multicolor),
      qty: body.qty ? parseInt(body.qty, 10) : 1,
      rush: toBool(body.rush),
      promo: (body.promo as CreateOrderParams['promo']) || null,
      addressState: body.addressState || null,
      email: body.email || null,
    };
    return this.orders.createFromStl(file.buffer, file.originalname, params);
  }

  @Get(':code')
  async status(@Param('code') code: string) {
    const status = await this.orders.getPublicStatus(code);
    if (!status) throw new NotFoundException('Order not found');
    return status;
  }
}
