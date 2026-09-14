import { ApiProperty } from '@nestjs/swagger';

export class CatalogItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isPreset!: boolean;
}

export class StatusItemDto {
  @ApiProperty()
  value!: string;

  @ApiProperty()
  label!: string;
}
