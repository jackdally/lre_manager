import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Program } from './Program';

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REPLACED = 'replaced'
}

@Entity()
export class ImportSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  originalFilename!: string;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: ImportStatus,
    default: ImportStatus.PENDING
  })
  status!: ImportStatus;

  @Column('int', { default: 0 })
  totalRecords!: number;

  @Column('int', { default: 0 })
  processedRecords!: number;

  @Column('int', { default: 0 })
  matchedRecords!: number;

  @Column('int', { default: 0 })
  unmatchedRecords!: number;

  @Column('int', { default: 0 })
  errorRecords!: number;

  @Column('json', { nullable: true })
  importConfig!: any;

  @Column('json', { nullable: true })
  results!: any;

  @Column('text', { nullable: true })
  errorMessage!: string | null;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  program!: Program;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  replacedBySessionId!: string | null;
} 