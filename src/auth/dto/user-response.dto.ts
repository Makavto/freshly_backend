import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  nickname!: string | null;

  @ApiProperty()
  isGuest!: boolean;

  @ApiPropertyOptional({ nullable: true, type: Number })
  productLimit!: number | null;

  @ApiProperty()
  productCount!: number;
}
