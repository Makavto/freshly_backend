import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductUnit } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  producedAt!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  expiresAt!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantity?: number | null;

  @ApiPropertyOptional({ enum: ProductUnit, nullable: true })
  @IsOptional()
  @IsEnum(ProductUnit)
  unit?: ProductUnit | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  categoryId?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => toOptionalNumber(value))
  @IsInt()
  @Min(1)
  storageLocationId?: number | null;
}

function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }
  return Number(value);
}
