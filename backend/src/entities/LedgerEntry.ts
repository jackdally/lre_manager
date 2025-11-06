import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Program } from './Program';
import { WbsElement } from './WbsElement';
import { CostCategory } from './CostCategory';
import { Vendor } from './Vendor';
import { Risk } from './Risk';

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

  // BOE Integration Fields
  @Column('uuid', { nullable: true })
  boeElementAllocationId?: string;

  @Column('uuid', { nullable: true })
  boeVersionId?: string;

  @Column('boolean', { default: false })
  createdFromBOE!: boolean;

  // Risk linking (legacy - deprecated, use risks relationship)
  @Column({ name: 'risk_id', nullable: true })
  riskId?: string | null;

  @ManyToOne(() => Risk, { nullable: true })
  @JoinColumn({ name: 'risk_id' })
  risk?: Risk;

  // Multiple risk linking (new approach)
  // Note: We use a custom junction entity (LedgerEntryRisk) instead of TypeORM's automatic ManyToMany
  // This allows us to add metadata like createdAt to the junction table
  // The risks relationship is loaded via the LedgerEntryRisk entity
  risks?: Risk[];
} 