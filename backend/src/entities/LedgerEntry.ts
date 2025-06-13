import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Program } from './Program';

@Entity()
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  vendor_name!: string;

  @Column('text')
  expense_description!: string;

  @Column()
  wbs_category!: string;

  @Column()
  wbs_subcategory!: string;

  @Column({ type: 'date' })
  baseline_date!: string;

  @Column('float')
  baseline_amount!: number;

  @Column({ type: 'date' })
  planned_date!: string;

  @Column('float')
  planned_amount!: number;

  @Column({ type: 'date', nullable: true })
  actual_date!: string | null;

  @Column('float', { nullable: true })
  actual_amount!: number | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  program!: Program;
} 