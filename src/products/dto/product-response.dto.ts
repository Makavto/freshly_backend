import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductUnit } from '@prisma/client';
import { CatalogItemDto } from '../../catalogs/dto/catalog-item.dto';
import { ProductStatus } from '../product-status';

export class ProductResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: '2026-09-01' })
  producedAt!: string;

  @ApiProperty({ example: '2026-12-31' })
  expiresAt!: string;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional({ enum: ProductUnit, nullable: true })
  unit!: ProductUnit | null;

  @ApiProperty()
  categoryId!: number;

  @ApiProperty()
  storageLocationId!: number;

  @ApiProperty({ type: CatalogItemDto })
  category!: CatalogItemDto;

  @ApiProperty({ type: CatalogItemDto })
  storageLocation!: CatalogItemDto;

  @ApiProperty({ enum: ProductStatus })
  status!: ProductStatus;

  @ApiProperty()
  isConsumed!: boolean;

  @ApiPropertyOptional({ nullable: true })
  photoUrl!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedProductsDto {
  @ApiProperty({ type: ProductResponseDto, isArray: true })
  items!: ProductResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
