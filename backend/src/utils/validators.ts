import Joi from "joi";

export const programSchema = Joi.object({
  code: Joi.string().required().pattern(/^[A-Z]{3}\.\d{4}$/),
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().required(),
  type: Joi.string().valid("Annual", "Period of Performance").required(),
  totalBudget: Joi.number().positive().required(),
  status: Joi.string().default("Active"),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  program_manager: Joi.string().optional()
});

export const ledgerEntrySchema = Joi.object({
  vendor_name: Joi.string().required(),
  expense_description: Joi.string().required(),
  wbsElementCode: Joi.string().required(),
  baseline_date: Joi.date().optional(),
  baseline_amount: Joi.number().positive().optional(),
  planned_date: Joi.date().optional(),
  planned_amount: Joi.number().positive().optional(),
  actual_date: Joi.date().optional(),
  actual_amount: Joi.number().positive().optional(),
  notes: Joi.string().optional(),
  invoice_link_text: Joi.string().optional(),
  invoice_link_url: Joi.string().uri().optional()
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});
