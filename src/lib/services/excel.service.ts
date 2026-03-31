import { apiClient } from '../api-config';
import type { ExcelImportResult, ExcelPreviewResponse, CategoryMapping } from '../types';

export const excelService = {
  async downloadProductsTemplate(): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/templates/products`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al descargar plantilla de productos');
    }
    
    return response.blob();
  },

  async downloadStockTemplate(): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/templates/stock`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al descargar plantilla de stock');
    }
    
    return response.blob();
  },

  async importProducts(file: File): Promise<ExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/import-products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar productos');
    }

    return response.json();
  },

  async previewProductsImport(file: File, warehouseId: string): Promise<ExcelPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('warehouseId', warehouseId);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/import-products-client/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al previsualizar importación');
    }

    return response.json();
  },

  async importProductsClient(
    file: File, 
    warehouseId: string, 
    categoryMappings?: CategoryMapping[]
  ): Promise<ExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('warehouseId', warehouseId);
    
    if (categoryMappings && categoryMappings.length > 0) {
      formData.append('categoryMappings', JSON.stringify(categoryMappings));
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/import-products-client`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar productos');
    }

    return response.json();
  },

  async updateStock(file: File): Promise<ExcelImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/update-stock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar stock');
    }

    return response.json();
  }
};
