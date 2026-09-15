export interface ApiUser {
  id: string;
  email: string;
  username: string | null;
  name: string;
  avatar: string | null;
  isVerified: boolean;
  storageUsed: string;
  storageLimit: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFile {
  id: string;
  name: string;
  originalName?: string;
  storageKey?: string;
  bucket?: string;
  mimeType: string;
  size: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFolder {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  path: string;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FileListResponse {
  files: ApiFile[];
  pagination: Pagination;
}

export type DashboardFileType = "image" | "audio" | "video" | "document" | "other" | "archive";

export interface DashboardResponse {
  storage: {
    used: string;
    limit: string;
    available: string;
    percentage: number;
  };
  statistics: {
    files: number;
    folder: number;
  };
  recentFiles: ApiFile[];
  fileType: { type: DashboardFileType; files: number; size: string }[];
}

export interface StorageUsage {
  used: string;
  limit: string;
  available: string;
  percentage: number;
}

export interface SearchResponse {
  items: ApiFile[];
  pagination: Pagination;
}

export interface SearchParams {
  q?: string;
  folderId?: string;
  mimeType?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "size";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PublicShare {
  id: string;
  fileId: string;
  shareUrl: string;
  expiresAt: string | null;
  hasPassword: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PublicShareDownload {
  downloadUrl: string;
  expiresAt: string;
}
