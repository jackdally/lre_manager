import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Program } from './Program';
import { WbsElement } from './WbsElement';

@Entity()
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  vendor_name!: string;

  @Column('text')
  expense_description!: string;

  // Hierarchical WBS reference
  @Column({ nullable: true })
  wbsElementId?: string;

  @Column({ type: 'date', nullable: true })
  baseline_date!: string | null;

  @Column('float', { nullable: true })
  baseline_amount!: number | null;

  @Column({ type: 'date', nullable: true })
  planned_date!: string | null;

  @Column('float', { nullable: true })
  planned_amount!: number | null;

  @Column({ type: 'date', nullable: true })
  actual_date!: string | null;

  @Column('float', { nullable: true })
  actual_amount!: number | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('text', { nullable: true })
  invoice_link_text!: string | null;

  @Column('text', { nullable: true })
  invoice_link_url!: string | null;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  program!: Program;

  @ManyToOne(() => WbsElement, { nullable: true })
  wbsElement?: WbsElement;
} 