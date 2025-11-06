import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { LedgerEntry } from './LedgerEntry';
import { Risk } from './Risk';

/**
 * Junction table for many-to-many relationship between LedgerEntry and Risk
 */
@Entity('ledger_entry_risk')
export class LedgerEntryRisk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ledgerEntryId!: string;

  @ManyToOne(() => LedgerEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledgerEntryId' })
  ledgerEntry!: LedgerEntry;

  @Column('uuid')
  riskId!: string;

  @ManyToOne(() => Risk, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riskId' })
  risk!: Risk;

  @CreateDateColumn()
  createdAt!: Date;
}

