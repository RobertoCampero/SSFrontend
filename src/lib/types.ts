export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  warehouseId?: string | number;
  createdAt?: string;
  updatedAt?: string;
  userRoles?: UserRole[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export type ClientType = 'REGULAR' | 'PREFERENCIAL';

export interface Client {
  id: string;
  name: string;
  documentType?: string;
  documentNum?: string;
  rut?: string; // Mantener para compatibilidad con datos antiguos
  email?: string;
  phone?: string;
  address?: string;
  clientType?: ClientType;
  type?: ClientType; // Mantener para compatibilidad con datos antiguos
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientRequest {
  name: string;
  documentType: string;
  documentNum: string;
  email?: string;
  phone?: string;
  address?: string;
  clientType: ClientType;
}

export interface UpdateClientRequest {
  name?: string;
  documentType?: string;
  documentNum?: string;
  email?: string;
  phone?: string;
  address?: string;
  clientType?: ClientType;
}

export interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ClientType;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  unitId: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  category?: Category;
  unit?: Unit;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  unitId: string;
  costPrice: number;
  salePrice: number;
  minStock?: number;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  description?: string;
  categoryId?: number;
  unitId?: string;
  costPrice?: number;
  salePrice?: number;
  minStock?: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
}

export interface ProductStock {
  productId: number;
  productName: string;
  totalStock: number;
  minStock: number;
  warehouses: {
    warehouseId: number;
    warehouseName: string;
    stock: number;
  }[];
}

export interface Supplier {
  id: number;
  name: string;
  rut: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  rut: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  rut?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export type QuoteStatus = 'PENDIENTE' | 'ENVIADA' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA';
export type PaymentType = 'CONTADO' | 'CREDITO';

export interface QuotePaymentTerm {
  id?: string;
  quoteId?: string;
  installmentNumber: number;
  percentage: number;
  amount?: number;
  daysAfterIssue: number;
  dueDate?: string;
  description?: string;
  isPaid?: boolean;
  paidAt?: string;
  createdAt?: string;
}

export type CreditStatus = 'paid' | 'pending' | 'overdue';

export interface CreditPayment {
  id: string;
  quoteId: string;
  installmentNumber: number;
  percentage: number;
  amount: number;
  daysAfterIssue: number;
  dueDate: string;
  description?: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  isOverdue: boolean;
  daysUntilDue: number;
  status: CreditStatus;
  quote: {
    id: string;
    quoteNumber: string;
    grandTotal: number;
    issueDate?: string;
    client: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    };
    creator?: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export interface CreditsSummary {
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  amountPending: number;
  amountPaid: number;
  amountOverdue: number;
  countPending: number;
  countPaid: number;
  countOverdue: number;
}

export interface CreditsListParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'pending' | 'paid' | 'overdue';
  clientId?: string;
  sortBy?: 'dueDate' | 'amount' | 'quoteNumber';
}
export type ItemType = 'PRODUCT' | 'SERVICE';
export type CostType = 'MANO_DE_OBRA' | 'TRANSPORTE' | 'ACCESORIOS' | 'MATERIAL';

export interface HiddenCost {
  id?: string;
  costType: CostType;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost?: number;
}

export interface ItemDetail {
  id?: string;
  description: string;
  sortOrder?: number;
}

export interface QuoteItem {
  id?: string;
  productId?: string | number;
  product?: {
    id: number | string;
    name: string;
    sku: string;
    brand?: string;
    origin?: string;
  };
  itemType: ItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  unitPriceBase?: number;
  discount?: number;
  taxPercent?: number;
  lineTotal?: number;
  total: number;
  sortOrder?: number;
  details?: ItemDetail[];
  hiddenCosts?: HiddenCost[];
}

export interface Quote {
  id: string;
  quoteNumber: string;
  version?: number;
  clientId: number | string;
  client?: {
    id: string;
    name: string;
    documentType?: string;
    documentNum?: string;
    rut?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  quoteType?: 'PRODUCTOS' | 'SERVICIOS';
  status: QuoteStatus;
  paymentType: PaymentType;
  cashPaymentPercentage?: number;
  validUntil: string;
  issueDate?: string;
  currency?: string;
  subtotal: number;
  discount: number;
  discountPercent?: number;
  taxTotal?: number;
  total: number;
  grandTotal?: number;
  notes?: string;
  observations?: string;
  termsConditions?: string;
  deliveryTime?: string;
  generalDescription?: string;
  responsibleName?: string;
  responsiblePosition?: string;
  responsiblePhone?: string;
  responsibleEmail?: string;
  salesExecutive?: string;
  items?: QuoteItem[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  creator?: {
    id: string;
    username: string;
    fullName: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  paymentTerms?: QuotePaymentTerm[];
}

export interface CreateQuoteRequest {
  clientId: number | string;
  quoteType?: 'PRODUCTOS' | 'SERVICIOS';
  version?: number;
  paymentType: PaymentType;
  cashPaymentPercentage?: number;
  validUntil: string;
  warehouseId?: number | string;
  discountPercent?: number;
  notes?: string;
  observations?: string;
  termsConditions?: string;
  deliveryTime?: string;
  generalDescription?: string;
  responsibleName?: string;
  responsiblePosition?: string;
  responsiblePhone?: string;
  responsibleEmail?: string;
  salesExecutive?: string;
  paymentTerms?: {
    installmentNumber: number;
    percentage: number;
    daysAfterIssue: number;
    description?: string;
  }[];
  items: {
    productId?: string | number;
    itemType: ItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    unitPriceBase?: number;
    discount?: number;
    sortOrder?: number;
    details?: string[];
    hiddenCosts?: {
      costType: CostType;
      description: string;
      quantity: number;
      unitCost: number;
    }[];
  }[];
}

export interface UpdateQuoteRequest {
  clientId?: number | string;
  version?: number;
  status?: QuoteStatus;
  paymentType?: PaymentType;
  cashPaymentPercentage?: number;
  validUntil?: string;
  discountPercent?: number;
  notes?: string;
  observations?: string;
  termsConditions?: string;
  deliveryTime?: string;
  generalDescription?: string;
  responsibleName?: string;
  responsiblePosition?: string;
  responsiblePhone?: string;
  responsibleEmail?: string;
  salesExecutive?: string;
  paymentTerms?: {
    installmentNumber: number;
    percentage: number;
    daysAfterIssue: number;
    description?: string;
  }[];
  items?: {
    productId?: string | number;
    itemType: ItemType;
    description: string;
    quantity: number;
    unitPrice: number;
    unitPriceBase?: number;
    discount?: number;
    sortOrder?: number;
    details?: string[];
    hiddenCosts?: {
      costType: CostType;
      description: string;
      quantity: number;
      unitCost: number;
    }[];
  }[];
}

export interface QuoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuoteStatus;
  clientId?: number;
}

export interface QuoteStockCheck {
  available: boolean;
  hasStock: boolean;
  items: {
    productId: number;
    productName: string;
    required: number;
    requiredQuantity: number;
    available: number;
    availableStock: number;
    hasStock: boolean;
  }[];
}

export interface CheckStockRequest {
  items: {
    productId: number;
    quantity: number;
  }[];
  warehouseId: number;
}

export interface ApproveQuoteRequest {
  status: 'APROBADA';
  warehouseId: string | number;
}

export interface ApproveQuoteResponse {
  quote: Quote;
  inventoryMovements: InventoryMovement[];
  message: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseWithStock extends Warehouse {
  stock: {
    productId: number;
    product: {
      id: number;
      name: string;
      sku: string;
    };
    quantity: number;
  }[];
}

export type MovementType = 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE';
export type MovementReason = 'COMPRA' | 'PROYECTO' | 'KIT' | 'DEVOLUCION' | 'AJUSTE_MANUAL' | 'VENTA' | 'SERVICIO';

export interface InventoryMovement {
  id: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  warehouseId: number;
  warehouse?: {
    id: number;
    name: string;
  };
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  notes?: string;
  referenceId?: number;
  createdAt: string;
}

export interface CreateMovementRequest {
  productId: number;
  warehouseId: number;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  notes?: string;
  referenceId?: number;
}

export interface TransferStockRequest {
  productId: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  quantity: number;
  notes?: string;
}

export interface TransferStockResponse {
  message: string;
  movements: {
    egreso: InventoryMovement;
    ingreso: InventoryMovement;
  };
}

export interface MovementListParams {
  page?: number;
  limit?: number;
  productId?: number;
  warehouseId?: number;
  type?: MovementType;
}

export interface LowStockProduct {
  productId: number;
  productName: string;
  sku: string;
  minStock: number;
  currentStock: number;
  difference: number;
  warehouses: {
    warehouseId: number;
    warehouseName: string;
    stock: number;
  }[];
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  brand?: string;
  origin?: string;
  manufacturerCode?: string;
  minStockGlobal: number;
  totalStock: number;
  isLowStock: boolean;
  category?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    code: string;
    name: string;
  };
  stockByWarehouse: {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    quantity: number;
  }[];
}

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  warehouseId?: number;
  lowStockOnly?: boolean;
}

// Roles y Permisos
export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  rolePermissions?: RolePermission[];
}

export interface Permission {
  id: string;
  code: string;
  description: string;
  module: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: Permission;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role?: Role;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface CreatePermissionRequest {
  code: string;
  description: string;
  module: string;
}

export interface UpdatePermissionRequest {
  description?: string;
  module?: string;
}

export interface BulkCreatePermissionsRequest {
  permissions: CreatePermissionRequest[];
}

export interface AssignPermissionsRequest {
  permissionIds: number[];
}

export interface AssignRoleToUserRequest {
  userId: number;
  roleId: number;
}

export interface RemoveRoleFromUserRequest {
  userId: number;
  roleId: number;
}

export interface RoleListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PermissionListParams {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}

// Importación Excel
export interface ExcelImportResult {
  message?: string;
  // Formato estándar (import-products)
  results?: {
    total: number;
    success: number;
    errors: number;
    successDetails: Array<{
      row: number;
      productId?: string;
      sku?: string;
      name?: string;
      warehouseId?: string;
      quantity?: number;
    }>;
    errorDetails: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  };
  // Formato cliente (import-products-client)
  total?: number;
  created?: number;
  updated?: number;
  success?: Array<{
    row: number;
    action: 'created' | 'updated';
    productId: string;
    sku: string;
    name: string;
  }>;
  errors?: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export interface ExcelPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  unknownCategories: string[];
  existingCategories: Array<{
    excelName: string;
    categoryId: number;
    categoryName: string;
  }>;
  preview: Array<{
    row: number;
    sku: string;
    name: string;
    category: string;
    quantity?: number;
    costPrice?: number;
    salePrice?: number;
    status: 'valid' | 'invalid' | 'unknown_category';
    errors?: string[];
  }>;
}

export interface CategoryMapping {
  excelName: string;
  categoryId: number;
}
