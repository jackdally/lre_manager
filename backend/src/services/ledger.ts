import { LedgerEntry } from '../entities/LedgerEntry';

export function calculateActualsToDate(entries: LedgerEntry[], date: Date = new Date()): number {
  return entries
    .filter(entry => entry.actual_amount && entry.actual_date && new Date(entry.actual_date) <= date)
    .reduce((sum, entry) => sum + Number(entry.actual_amount), 0);
}

export function calculatePlannedToDate(entries: LedgerEntry[], date: Date = new Date()): number {
  return entries
    .filter(entry => entry.planned_amount && entry.planned_date && new Date(entry.planned_date) <= date)
    .reduce((sum, entry) => sum + Number(entry.planned_amount), 0);
}

export function calculateScheduleVariance(entries: LedgerEntry[], date: Date = new Date()): number {
  return calculatePlannedToDate(entries, date) - calculateActualsToDate(entries, date);
}

export function calculateCostVariance(entries: LedgerEntry[], date: Date = new Date()): number {
  return calculatePlannedToDate(entries, date) - calculateActualsToDate(entries, date);
}

export function calculateSPI(entries: LedgerEntry[], date: Date = new Date()): number {
  const planned = calculatePlannedToDate(entries, date);
  const actual = calculateActualsToDate(entries, date);
  return actual !== 0 ? planned / actual : 0;
} 