import { Category, DEFAULT_CATEGORIES } from '../models/category.model';

export class CategoryService {
  async listCategories() {
    return Category.find({ isActive: true }).sort({ name: 1 }).lean();
  }

  async initializeDefaultCategories() {
    for (const category of DEFAULT_CATEGORIES) {
      await Category.updateOne(
        { name: category.name },
        { $setOnInsert: category },
        { upsert: true }
      );
    }
  }
}

export const categoryService = new CategoryService();
