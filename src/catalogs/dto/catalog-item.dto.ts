import { ApiProperty } from '@nestjs/swagger';
import { ProductUnit } from '@prisma/client';

export class CatalogItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  isPreset!: boolean;
}

export class StatusItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;
}

export class UnitItemDto {
  @ApiProperty({ enum: ProductUnit })
  id!: ProductUnit;

  @ApiProperty()
  label!: string;
}
