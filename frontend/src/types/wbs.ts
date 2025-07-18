export interface WbsElement {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  parentId?: string;
  programId: string;
  children: WbsElement[];
  createdAt: string;
  updatedAt: string;
}

export interface WbsElementFormData {
  code: string;
  name: string;
  description: string;
  level: number;
  parentId?: string;
}

export interface WbsSearchResult {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  parentId?: string;
  programId: string;
} 