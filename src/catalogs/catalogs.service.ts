import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, ProductUnit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CatalogItemDto,
  StatusItemDto,
  UnitItemDto,
} from './dto/catalog-item.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(userId: number): Promise<CatalogItemDto[]> {
    const items = await this.prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    return items.map((item) => this.toDto(item));
  }

  async createCategory(
    userId: number,
    dto: CreateCatalogItemDto,
  ): Promise<CatalogItemDto> {
    try {
      const item = await this.prisma.category.create({
        data: { name: dto.name, userId },
      });
      return this.toDto(item);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async listStorageLocations(userId: number): Promise<CatalogItemDto[]> {
    const items = await this.prisma.storageLocation.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    return items.map((item) => this.toDto(item));
  }

  async createStorageLocation(
    userId: number,
    dto: CreateCatalogItemDto,
  ): Promise<CatalogItemDto> {
    try {
      const item = await this.prisma.storageLocation.create({
        data: { name: dto.name, userId },
      });
      return this.toDto(item);
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  listStatuses(): StatusItemDto[] {
    return [
      { id: 'fresh', label: 'свежий' },
      { id: 'expiring_soon', label: 'скоро истекает' },
      { id: 'expired', label: 'просрочен' },
    ];
  }

  listUnits(): UnitItemDto[] {
    return [
      { id: ProductUnit.PIECE, label: 'штука' },
      { id: ProductUnit.GRAM, label: 'грамм' },
      { id: ProductUnit.KILOGRAM, label: 'килограмм' },
      { id: ProductUnit.MILLILITER, label: 'миллилитр' },
      { id: ProductUnit.LITER, label: 'литр' },
      { id: ProductUnit.PACK, label: 'упаковка' },
    ];
  }

  private toDto(item: { id: number; name: string; userId: number | null }) {
    return {
      id: item.id,
      label: item.name,
      isPreset: item.userId === null,
    };
  }

  private rethrowUnique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Name already exists');
    }
    throw error;
  }
}
