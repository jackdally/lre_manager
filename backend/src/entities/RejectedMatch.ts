import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { ImportTransaction } from './ImportTransaction';
import { LedgerEntry } from './LedgerEntry';

@Entity()
export class RejectedMatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ImportTransaction, { onDelete: 'CASCADE' })
  transaction!: ImportTransaction;

  @ManyToOne(() => LedgerEntry, { onDelete: 'CASCADE' })
  ledgerEntry!: LedgerEntry;

  @CreateDateColumn()
  createdAt!: Date;
} 