import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ImportTransaction } from './ImportTransaction';
import { LedgerEntry } from './LedgerEntry';

export type PotentialMatchStatus = 'potential' | 'confirmed' | 'rejected';

@Entity()
@Index(['transaction', 'ledgerEntry'], { unique: true })
export class PotentialMatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ImportTransaction, { eager: true, onDelete: 'CASCADE' })
  transaction!: ImportTransaction;

  @ManyToOne(() => LedgerEntry, { eager: true, onDelete: 'CASCADE' })
  ledgerEntry!: LedgerEntry;

  @Column('float', { nullable: true })
  confidence!: number;

  @Column({ type: 'varchar', length: 20, default: 'potential' })
  status!: PotentialMatchStatus;

  @Column({ type: 'text', nullable: true })
  reasons!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 