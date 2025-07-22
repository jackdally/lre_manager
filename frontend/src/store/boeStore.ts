import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface BOETemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  isActive: boolean;
  isDefault: boolean;
  parentTemplateId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  elements?: BOETemplateElement[];
}

export interface BOETemplateElement {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  parentElementId?: string;
  costCategoryId?: string;
  estimatedCost?: number;
  managementReservePercentage?: number;
  isRequired: boolean;
  isOptional: boolean;
  notes?: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BOEVersion {
  id: string;
  versionNumber: string;
  name: string;
  description: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Archived';
  templateId?: string;
  totalEstimatedCost: number;
  managementReserveAmount: number;
  managementReservePercentage: number;
  changeSummary?: string;
  justification?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  programId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  elements?: BOEElement[];
  approvals?: BOEApproval[];
}

export interface BOEElement {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  parentElementId?: string;
  costCategoryId?: string;
  vendorId?: string;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  managementReservePercentage?: number;
  managementReserveAmount: number;
  isRequired: boolean;
  isOptional: boolean;
  notes?: string;
  assumptions?: string;
  risks?: string;
  boeVersionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BOEApproval {
  id: string;
  approvalLevel: number;
  approverRole: string;
  approverName?: string;
  approverEmail?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  rejectionReason?: string;
  isRequired: boolean;
  isOptional: boolean;
  sequenceOrder: number;
  boeVersionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagementReserve {
  id: string;
  baselineAmount: number;
  baselinePercentage: number;
  adjustedAmount: number;
  adjustedPercentage: number;
  utilizedAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  calculationMethod: 'Standard' | 'Risk-Based' | 'Custom';
  justification?: string;
  riskFactors?: string;
  notes?: string;
  isActive: boolean;
  boeVersionId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface BOESummary {
  hasBOE: boolean;
  program: {
    id: string;
    name: string;
    code: string;
  };
  currentBOE?: BOEVersion;
  summary?: {
    totalElements: number;
    requiredElements: number;
    optionalElements: number;
    totalCost: number;
    managementReserve: number;
    totalWithMR: number;
  };
}

// Store State
interface BOEState {
  // Templates
  templates: BOETemplate[];
  selectedTemplate: BOETemplate | null;
  templatesLoading: boolean;
  templatesError: string | null;

  // BOE Versions
  currentBOE: BOEVersion | null;
  boeVersions: BOEVersion[];
  boeLoading: boolean;
  boeError: string | null;

  // Elements
  elements: BOEElement[];
  selectedElement: BOEElement | null;
  elementsLoading: boolean;
  elementsError: string | null;

  // Management Reserve
  managementReserve: ManagementReserve | null;
  mrLoading: boolean;
  mrError: string | null;

  // UI State
  isCreatingBOE: boolean;
  isUpdatingBOE: boolean;
  isDeletingBOE: boolean;
  activeTab: 'overview' | 'details' | 'approval' | 'history';
  wizardStep: number;
  wizardData: any;

  // Actions
  setTemplates: (templates: BOETemplate[]) => void;
  setSelectedTemplate: (template: BOETemplate | null) => void;
  setTemplatesLoading: (loading: boolean) => void;
  setTemplatesError: (error: string | null) => void;

  setCurrentBOE: (boe: BOEVersion | null) => void;
  setBOEVersions: (versions: BOEVersion[]) => void;
  setBOELoading: (loading: boolean) => void;
  setBOEError: (error: string | null) => void;

  setElements: (elements: BOEElement[]) => void;
  setSelectedElement: (element: BOEElement | null) => void;
  setElementsLoading: (loading: boolean) => void;
  setElementsError: (error: string | null) => void;

  setManagementReserve: (mr: ManagementReserve | null) => void;
  setMRLoading: (loading: boolean) => void;
  setMRError: (error: string | null) => void;

  setCreatingBOE: (creating: boolean) => void;
  setUpdatingBOE: (updating: boolean) => void;
  setDeletingBOE: (deleting: boolean) => void;
  setActiveTab: (tab: 'overview' | 'details' | 'approval' | 'history') => void;
  setWizardStep: (step: number) => void;
  setWizardData: (data: any) => void;

  // Computed values
  getTotalEstimatedCost: () => number;
  getManagementReserveAmount: () => number;
  getTotalWithMR: () => number;
  getElementCount: () => number;
  getRequiredElementCount: () => number;
  getOptionalElementCount: () => number;

  // Reset
  resetBOE: () => void;
  resetWizard: () => void;
}

// Initial State
const initialState = {
  // Templates
  templates: [],
  selectedTemplate: null,
  templatesLoading: false,
  templatesError: null,

  // BOE Versions
  currentBOE: null,
  boeVersions: [],
  boeLoading: false,
  boeError: null,

  // Elements
  elements: [],
  selectedElement: null,
  elementsLoading: false,
  elementsError: null,

  // Management Reserve
  managementReserve: null,
  mrLoading: false,
  mrError: null,

  // UI State
  isCreatingBOE: false,
  isUpdatingBOE: false,
  isDeletingBOE: false,
  activeTab: 'overview' as const,
  wizardStep: 0,
  wizardData: {},
};

// Store
export const useBOEStore = create<BOEState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Template Actions
      setTemplates: (templates) => set({ templates }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setTemplatesLoading: (loading) => set({ templatesLoading: loading }),
      setTemplatesError: (error) => set({ templatesError: error }),

      // BOE Version Actions
      setCurrentBOE: (boe) => set({ currentBOE: boe }),
      setBOEVersions: (versions) => set({ boeVersions: versions }),
      setBOELoading: (loading) => set({ boeLoading: loading }),
      setBOEError: (error) => set({ boeError: error }),

      // Element Actions
      setElements: (elements) => set({ elements }),
      setSelectedElement: (element) => set({ selectedElement: element }),
      setElementsLoading: (loading) => set({ elementsLoading: loading }),
      setElementsError: (error) => set({ elementsError: error }),

      // Management Reserve Actions
      setManagementReserve: (mr) => set({ managementReserve: mr }),
      setMRLoading: (loading) => set({ mrLoading: loading }),
      setMRError: (error) => set({ mrError: error }),

      // UI Actions
      setCreatingBOE: (creating) => set({ isCreatingBOE: creating }),
      setUpdatingBOE: (updating) => set({ isUpdatingBOE: updating }),
      setDeletingBOE: (deleting) => set({ isDeletingBOE: deleting }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setWizardStep: (step) => set({ wizardStep: step }),
      setWizardData: (data) => set({ wizardData: data }),

      // Computed Values
      getTotalEstimatedCost: () => {
        const { elements } = get();
        return elements.reduce((total, element) => total + (element.estimatedCost || 0), 0);
      },

      getManagementReserveAmount: () => {
        const { managementReserve } = get();
        return managementReserve?.adjustedAmount || 0;
      },

      getTotalWithMR: () => {
        const { getTotalEstimatedCost, getManagementReserveAmount } = get();
        return getTotalEstimatedCost() + getManagementReserveAmount();
      },

      getElementCount: () => {
        const { elements } = get();
        return elements.length;
      },

      getRequiredElementCount: () => {
        const { elements } = get();
        return elements.filter(element => element.isRequired).length;
      },

      getOptionalElementCount: () => {
        const { elements } = get();
        return elements.filter(element => element.isOptional).length;
      },

      // Reset Actions
      resetBOE: () => set({
        currentBOE: null,
        boeVersions: [],
        elements: [],
        selectedElement: null,
        managementReserve: null,
        boeLoading: false,
        boeError: null,
        elementsLoading: false,
        elementsError: null,
        mrLoading: false,
        mrError: null,
      }),

      resetWizard: () => set({
        wizardStep: 0,
        wizardData: {},
        selectedTemplate: null,
      }),
    }),
    {
      name: 'boe-store',
    }
  )
); 