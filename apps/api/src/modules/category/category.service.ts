import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { slugify } from '../../common/utils/slug.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAllActive(): Promise<CategoryEntity[]> {
    const categories = await this.categoryRepository.findAllActive();
    return categories.map((category) => this.toEntity(category));
  }

  async findAll(): Promise<CategoryEntity[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map((category) => this.toEntity(category));
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = await this.ensureUniqueSlug(dto.name);
    const category = await this.categoryRepository.create({
      name: dto.name,
      slug,
      isActive: dto.is_active ?? true,
    });
    return this.toEntity(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Categoria não encontrada');
    }

    let slug: string | undefined;
    if (dto.name && dto.name !== existing.name) {
      slug = await this.ensureUniqueSlug(dto.name, id);
    }

    const category = await this.categoryRepository.update(id, {
      name: dto.name,
      slug,
      isActive: dto.is_active,
    });

    return this.toEntity(category);
  }

  private async ensureUniqueSlug(name: string, excludedId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let suffix = 1;

    while (await this.categoryRepository.findBySlug(slug, excludedId)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    if (!slug) {
      throw new ConflictException('Slug de categoria inválido');
    }

    return slug;
  }

  private toEntity(category: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CategoryEntity {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      is_active: category.isActive,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    };
  }
}
