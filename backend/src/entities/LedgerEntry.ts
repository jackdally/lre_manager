import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Program } from './Program';
import { WbsElement } from './WbsElement';
import { CostCategory } from './CostCategory';
import { Vendor } from './Vendor';

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
  @JoinColumn({ name: 'wbsElementId' })
  wbsElement?: WbsElement;

  @Column({ name: 'cost_category_id', nullable: true })
  costCategoryId?: string;

  @ManyToOne(() => CostCategory, { nullable: true })
  @JoinColumn({ name: 'cost_category_id' })
  costCategory?: CostCategory;

  @Column({ name: 'vendor_id', nullable: true })
  vendorId?: string;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;
} 