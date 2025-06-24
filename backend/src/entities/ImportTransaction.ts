import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ImportSession } from './ImportSession';
import { LedgerEntry } from './LedgerEntry';

export enum TransactionStatus {
  UNMATCHED = 'unmatched',
  MATCHED = 'matched',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  ADDED_TO_LEDGER = 'added_to_ledger',
  REPLACED = 'replaced'
}

export enum DuplicateType {
  NONE = 'none',
  EXACT_DUPLICATE = 'exact_duplicate',
  DIFFERENT_INFO_CONFIRMED = 'different_info_confirmed',
  DIFFERENT_INFO_PENDING = 'different_info_pending',
  ORIGINAL_REJECTED = 'original_rejected',
  NO_INVOICE_POTENTIAL = 'no_invoice_potential',
  MULTIPLE_POTENTIAL = 'multiple_potential'
}

@Entity()
export class ImportTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  vendorName!: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'date' })
  transactionDate!: string;

  @Column({ nullable: true })
  programCode!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ nullable: true })
  subcategory!: string;

  @Column({ nullable: true })
  invoiceNumber!: string;

  @Column({ nullable: true })
  referenceNumber!: string;

  @Column({ nullable: true })
  transactionId!: string;

  @Column('json', { nullable: true })
  rawData!: any;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.UNMATCHED
  })
  status!: TransactionStatus;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  matchConfidence!: number | null;

  @Column('json', { nullable: true })
  suggestedMatches!: any[];

  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession!: ImportSession;

  @ManyToOne(() => LedgerEntry, { nullable: true })
  matchedLedgerEntry!: LedgerEntry | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({
    type: 'enum',
    enum: DuplicateType,
    default: DuplicateType.NONE
  })
  duplicateType!: DuplicateType;

  @Column({ type: 'uuid', nullable: true })
  duplicateOfId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  preservedFromSessionId!: string | null;
} 