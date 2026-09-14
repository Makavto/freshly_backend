import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { CatalogsService } from './catalogs.service';
import { CatalogItemDto, StatusItemDto } from './dto/catalog-item.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@ApiTags('catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Категории: пресеты и пользовательские' })
  @ApiOkResponse({ type: CatalogItemDto, isArray: true })
  listCategories(@CurrentUser() user: AuthUser): Promise<CatalogItemDto[]> {
    return this.catalogsService.listCategories(user.id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Создать пользовательскую категорию' })
  @ApiCreatedResponse({ type: CatalogItemDto })
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCatalogItemDto,
  ): Promise<CatalogItemDto> {
    return this.catalogsService.createCategory(user.id, dto);
  }

  @Get('storage-locations')
  @ApiOperation({ summary: 'Места хранения: пресеты и пользовательские' })
  @ApiOkResponse({ type: CatalogItemDto, isArray: true })
  listStorageLocations(
    @CurrentUser() user: AuthUser,
  ): Promise<CatalogItemDto[]> {
    return this.catalogsService.listStorageLocations(user.id);
  }

  @Post('storage-locations')
  @ApiOperation({ summary: 'Создать пользовательское место хранения' })
  @ApiCreatedResponse({ type: CatalogItemDto })
  createStorageLocation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCatalogItemDto,
  ): Promise<CatalogItemDto> {
    return this.catalogsService.createStorageLocation(user.id, dto);
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Статусы продуктов' })
  @ApiOkResponse({ type: StatusItemDto, isArray: true })
  listStatuses(): StatusItemDto[] {
    return this.catalogsService.listStatuses();
  }
}
