export interface Program {
  id: string;
  code: string;
  name: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number;
  type: "Annual" | "Period of Performance";
  program_manager?: string | null;
}

export interface ProgramCreateRequest {
  code: string;
  name: string;
  description: string;
  type: "Annual" | "Period of Performance";
  totalBudget: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  program_manager?: string;
  wbsTemplateId?: string;
}

export interface ProgramUpdateRequest extends Partial<ProgramCreateRequest> {
  id: string;
}
