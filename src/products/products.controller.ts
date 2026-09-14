import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import {
  PaginatedProductsDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать продукт' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список продуктов' })
  @ApiOkResponse({ type: PaginatedProductsDto })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryProductsDto,
  ): Promise<PaginatedProductsDto> {
    return this.productsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить продукт' })
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить продукт' })
  @ApiOkResponse({ type: ProductResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить продукт' })
  @ApiNoContentResponse()
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.productsService.remove(user.id, id);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PHOTO_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Загрузить фото продукта' })
  @ApiOkResponse({ type: ProductResponseDto })
  uploadPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: MAX_PHOTO_SIZE })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    return this.productsService.uploadPhoto(user.id, id, file);
  }

  @Delete(':id/photo')
  @ApiOperation({ summary: 'Удалить фото продукта' })
  @ApiOkResponse({ type: ProductResponseDto })
  removePhoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    return this.productsService.removePhoto(user.id, id);
  }
}
