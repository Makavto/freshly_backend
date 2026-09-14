import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import {
  DEFAULT_CATEGORY_ID,
  DEFAULT_STORAGE_LOCATION_ID,
} from '../catalogs/catalog.constants';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorage } from '../storage/file-storage';
import { CreateProductDto } from './dto/create-product.dto';
import {
  PaginatedProductsDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { getProductStatus, statusToExpiresAtFilter } from './product-status';

const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: true; storageLocation: true };
}>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorage,
    private readonly config: ConfigService,
  ) {}

  async create(
    userId: number,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const categoryId = dto.categoryId ?? DEFAULT_CATEGORY_ID;
    const storageLocationId =
      dto.storageLocationId ?? DEFAULT_STORAGE_LOCATION_ID;
    await this.assertCatalogAccess(userId, categoryId, storageLocationId);

    const product = await this.prisma.product.create({
      data: {
        userId,
        name: dto.name,
        expiresAt: new Date(dto.expiresAt),
        quantity: dto.quantity ?? 1,
        unit: dto.unit ?? null,
        categoryId,
        storageLocationId,
      },
      include: { category: true, storageLocation: true },
    });
    return this.toResponse(product);
  }

  async findAll(
    userId: number,
    query: QueryProductsDto,
  ): Promise<PaginatedProductsDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'expiresAt';
    const sortOrder = query.sortOrder ?? 'asc';
    const expiringSoonDays = this.expiringSoonDays();

    const where: Prisma.ProductWhereInput = { userId };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.storageLocationId) {
      where.storageLocationId = query.storageLocationId;
    }
    if (query.status) {
      where.expiresAt = statusToExpiresAtFilter(
        query.status,
        new Date(),
        expiringSoonDays,
      );
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true, storageLocation: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: await Promise.all(items.map((item) => this.toResponse(item))),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: number, id: number): Promise<ProductResponseDto> {
    const product = await this.getOwnedProduct(userId, id);
    return this.toResponse(product);
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const current = await this.getOwnedProduct(userId, id);
    if (dto.categoryId || dto.storageLocationId) {
      await this.assertCatalogAccess(
        userId,
        dto.categoryId ?? current.categoryId,
        dto.storageLocationId ?? current.storageLocationId,
      );
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: new Date(dto.expiresAt) }
          : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.storageLocationId !== undefined
          ? { storageLocationId: dto.storageLocationId }
          : {}),
      },
      include: { category: true, storageLocation: true },
    });
    return this.toResponse(product);
  }

  async remove(userId: number, id: number): Promise<void> {
    const product = await this.getOwnedProduct(userId, id);
    if (product.photoKey) {
      await this.storage.delete(product.photoKey);
    }
    await this.prisma.product.delete({ where: { id } });
  }

  async uploadPhoto(
    userId: number,
    id: number,
    file: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    this.assertPhoto(file);
    const product = await this.getOwnedProduct(userId, id);
    const uploaded = await this.storage.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      keyPrefix: `products/${userId}/${id}`,
    });
    const previousKey = product.photoKey;
    const updated = await this.prisma.product.update({
      where: { id },
      data: { photoKey: uploaded.key },
      include: { category: true, storageLocation: true },
    });
    if (previousKey) {
      await this.storage.delete(previousKey);
    }
    return this.toResponse(updated);
  }

  async removePhoto(userId: number, id: number): Promise<ProductResponseDto> {
    const product = await this.getOwnedProduct(userId, id);
    if (product.photoKey) {
      await this.storage.delete(product.photoKey);
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { photoKey: null },
      include: { category: true, storageLocation: true },
    });
    return this.toResponse(updated);
  }

  private async getOwnedProduct(
    userId: number,
    id: number,
  ): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
      include: { category: true, storageLocation: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async assertCatalogAccess(
    userId: number,
    categoryId: number,
    storageLocationId: number,
  ): Promise<void> {
    const [category, location] = await Promise.all([
      this.prisma.category.findFirst({
        where: { id: categoryId, OR: [{ userId: null }, { userId }] },
      }),
      this.prisma.storageLocation.findFirst({
        where: { id: storageLocationId, OR: [{ userId: null }, { userId }] },
      }),
    ]);
    if (!category) {
      throw new BadRequestException('Category is not available');
    }
    if (!location) {
      throw new BadRequestException('Storage location is not available');
    }
  }

  private assertPhoto(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }
    if (!ALLOWED_PHOTO_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }
  }

  private async toResponse(
    product: ProductWithRelations,
  ): Promise<ProductResponseDto> {
    return {
      id: product.id,
      name: product.name,
      expiresAt: product.expiresAt.toISOString().slice(0, 10),
      quantity: product.quantity.toNumber(),
      unit: product.unit,
      categoryId: product.categoryId,
      storageLocationId: product.storageLocationId,
      category: {
        id: product.category.id,
        name: product.category.name,
        isPreset: product.category.userId === null,
      },
      storageLocation: {
        id: product.storageLocation.id,
        name: product.storageLocation.name,
        isPreset: product.storageLocation.userId === null,
      },
      status: getProductStatus(
        product.expiresAt,
        new Date(),
        this.expiringSoonDays(),
      ),
      photoUrl: product.photoKey
        ? await this.storage.getUrl(product.photoKey)
        : null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private expiringSoonDays(): number {
    return this.config.get<number>('EXPIRING_SOON_DAYS') ?? 3;
  }
}
