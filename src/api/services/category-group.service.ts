import { supabase } from '../../config/supabase.js';
import type { CategoryGroup } from '../models/category-group.model.js';

export const getCategoryGroups = async (): Promise<CategoryGroup[]> => {
  const { data, error } = await supabase
    .from('category_groups')
    .select('id, name, description, sort_order')
    .order('sort_order', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to fetch category groups: ${error.message}`);
  }
  
  return data as CategoryGroup[];
};