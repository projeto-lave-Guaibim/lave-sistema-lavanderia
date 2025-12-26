import { supabase } from './supabaseClient';
import { Service, CatalogItem } from '../types';

export const catalogService = {
  // Services
  getServices: async (): Promise<Service[]> => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return data as Service[];
  },

  createService: async (service: Omit<Service, 'id'>): Promise<Service> => {
    const { data, error } = await supabase
      .from('services')
      .insert([
        {
          name: service.name,
          type: service.type,
          price: service.price,
          description: service.description,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Service;
  },

  updateService: async (service: Service): Promise<Service> => {
    const { data, error } = await supabase
      .from('services')
      .update({
        name: service.name,
        type: service.type,
        price: service.price,
        description: service.description,
      })
      .eq('id', service.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Service;
  },

  deleteService: async (id: string): Promise<void> => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Catalog Items
  getItems: async (): Promise<CatalogItem[]> => {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return data as CatalogItem[];
  },

  createItem: async (item: Omit<CatalogItem, 'id'>): Promise<CatalogItem> => {
    const { data, error } = await supabase
      .from('catalog_items')
      .insert([
        {
          name: item.name,
          category: item.category,
          price: item.price,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CatalogItem;
  },

  updateItem: async (item: CatalogItem): Promise<CatalogItem> => {
    const { data, error } = await supabase
      .from('catalog_items')
      .update({
        name: item.name,
        category: item.category,
        price: item.price,
      })
      .eq('id', item.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CatalogItem;
  },

  deleteItem: async (id: string): Promise<void> => {
    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Extras
  getExtras: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .order('name');
    if (error) throw new Error(error.message);
    return data as any[];
  },

  createExtra: async (extra: { name: string; price: number }): Promise<any> => {
    const { data, error } = await supabase
      .from('extras')
      .insert([extra])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteExtra: async (id: string): Promise<void> => {
    const { error } = await supabase.from('extras').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
