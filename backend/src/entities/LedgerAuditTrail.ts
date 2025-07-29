import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LedgerEntry } from './LedgerEntry';

export enum AuditAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  PUSHED_FROM_BOE = 'pushed_from_boe',
  SPLIT = 'split',
  MERGED = 'merged',
  RE_FORECASTED = 're_forecasted',
  MATCHED_TO_INVOICE = 'matched_to_invoice',
  UNMATCHED_FROM_INVOICE = 'unmatched_from_invoice',
  SCHEDULE_CHANGE = 'schedule_change'
}

export enum AuditSource {
  MANUAL = 'manual',
  BOE_ALLOCATION = 'boe_allocation',
  BOE_PUSH = 'boe_push',
  INVOICE_MATCH = 'invoice_match',
  RE_FORECASTED = 're_forecasted',
  SYSTEM = 'system',
  TRANSACTION_ADJUSTMENT = 'transaction_adjustment'
}

@Entity('ledger_audit_trail')
export class LedgerAuditTrail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ledgerEntryId!: string;

  @ManyToOne(() => LedgerEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledgerEntryId' })
  ledgerEntry!: LedgerEntry;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action!: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditSource,
    default: AuditSource.MANUAL
  })
  source!: AuditSource;

  @Column('text', { nullable: true })
  userId?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  previousValues?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValues?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @Column('uuid', { nullable: true })
  boeElementAllocationId?: string;

  @Column('uuid', { nullable: true })
  boeVersionId?: string;

  @Column('uuid', { nullable: true })
  relatedLedgerEntryId?: string;

  @Column('text', { nullable: true })
  sessionId?: string;
} 