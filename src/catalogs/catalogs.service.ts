import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogItemDto, StatusItemDto } from './dto/catalog-item.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(userId: string): Promise<CatalogItemDto[]> {
    const items = await this.prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    return items.map((item) => this.toDto(item));
  }

  async createCategory(
    userId: string,
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

  async listStorageLocations(userId: string): Promise<CatalogItemDto[]> {
    const items = await this.prisma.storageLocation.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    return items.map((item) => this.toDto(item));
  }

  async createStorageLocation(
    userId: string,
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
      { value: 'fresh', label: 'свежий' },
      { value: 'expiring_soon', label: 'скоро истекает' },
      { value: 'expired', label: 'просрочен' },
    ];
  }

  private toDto(item: { id: string; name: string; userId: string | null }) {
    return {
      id: item.id,
      name: item.name,
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
