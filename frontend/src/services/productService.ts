import { authService } from './authService';

export interface Unit {
  id: number;
  code: string;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitId: number;
  isSellable: boolean;
  createdAt: string;
  updatedAt: string;
  unit?: Unit;
  batches?: unknown[];
}

export interface CreateProductDto {
  name: string;
  sku: string;
  category: string;
  unitId: number;
  isSellable: boolean;
}

export interface UpdateProductDto {
  name?: string;
  sku?: string;
  category?: string;
  unitId?: number;
  isSellable?: boolean;
}

export interface CreateUnitDto {
  code: string;
  name: string;
}

export interface ProductsFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Product[];
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  totalUnits: number;
  lowStockProducts: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fonction utilitaire pour les requêtes
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = authService.getToken();
  
  if (!token) {
    throw new Error('Token d\'authentification manquant');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.body && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 404) {
        throw new Error('Ressource non trouvée');
      }

      if (response.status === 400) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Requête invalide');
      }
      
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur serveur'}`);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
    throw error;
  }
};

// Service des Unités
export const unitService = {
  getAll: async (): Promise<Unit[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/units`);
    return await response.json();
  },

  getById: async (id: number): Promise<Unit> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/units/${id}`);
    return await response.json();
  },

  create: async (data: CreateUnitDto): Promise<Unit> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/units`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response.status === 201) {
        return await response.json();
      }

      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur lors de la création'}`);
      
    } catch (error) {
      console.error('❌ Erreur création unité:', error);
      throw error;
    }
  },

  // Nouvelle fonction pour supprimer une unité
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/units/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 200) {
        return;
      }

      const errorText = await response.text();
      throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur lors de la suppression de l\'unité'}`);
    } catch (error) {
      console.error('❌ Erreur suppression unité:', error);
      throw error;
    }
  }
};

// Service des Produits (inchangé)
export const productService = {
  getAll: async (filters: ProductsFilters = {}): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    console.log(filters)
    if (filters.category && filters.category !== 'Tous') {
      queryParams.append('category', filters.category);
    }
    
    if (filters.search && filters.search.trim() !== '') {
      queryParams.append('search', filters.search.trim());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}/products?${queryString}` : `${API_BASE_URL}/products`;
    
    const response = await fetchWithAuth(url);
    const responseData = await response.json();
    
    if (Array.isArray(responseData)) {
      return {
        page: 1,
        limit: 20,
        total: responseData.length,
        totalPages: 1,
        data: responseData
      };
    }
    
    console.warn('Format de réponse inattendu:', responseData);
    return {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      data: []
    };
  },

  getById: async (id: number): Promise<Product> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`);
    return await response.json();
  },

  getBySku: async (sku: string): Promise<Product> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/sku/${sku}`);
    return await response.json();
  },

  getSellable: async (): Promise<Product[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/sellable`);
    return await response.json();
  },

  getStock: async (id: number): Promise<number> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}/stock`);
      const data = await response.json();
      return data.currentStock || 0;
    } catch (error) {
      console.warn(`Erreur récupération stock produit ${id}:`, error);
      return 0;
    }
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/products/dashboard/stats`);
      
      if (response.status === 404) {
        console.warn('Endpoint /dashboard/stats non trouvé, utilisation des valeurs par défaut');
        return {
          totalProducts: 0,
          totalValue: 0,
          totalUnits: 0,
          lowStockProducts: 0
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats dashboard:', error);
      return {
        totalProducts: 0,
        totalValue: 0,
        totalUnits: 0,
        lowStockProducts: 0
      };
    }
  }
};