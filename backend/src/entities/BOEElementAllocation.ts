import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BOEElement } from './BOEElement';
import { BOEVersion } from './BOEVersion';
import { Vendor } from './Vendor';

@Entity()
export class BOEElementAllocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // e.g., "Software Development - Level 1"

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount!: number; // Total allocation amount for this element

  @Column()
  allocationType!: 'Linear' | 'Front-Loaded' | 'Back-Loaded' | 'Custom';

  @Column({ type: 'date' })
  startDate!: string; // When the allocation period begins

  @Column({ type: 'date' })
  endDate!: string; // When the allocation period ends

  @Column()
  numberOfMonths!: number; // Calculated from start/end dates

  @Column('decimal', { precision: 15, scale: 2 })
  monthlyAmount!: number; // Calculated: totalAmount / numberOfMonths

  @Column({ default: false })
  isActive!: boolean;

  @Column({ default: false })
  isLocked!: boolean; // Prevents changes once pushed to ledger

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('text', { nullable: true })
  assumptions!: string | null;

  @Column('text', { nullable: true })
  risks!: string | null;

  // Quantity tracking support
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalQuantity!: number | null; // e.g., hours, units, etc.

  @Column({ type: 'varchar', nullable: true })
  quantityUnit!: string | null; // e.g., "hours", "units", "days"

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  monthlyQuantity!: number | null; // Calculated quantity per month

  // Relationships
  @Column()
  boeElementId!: string; // Required link to specific BOE element

  @ManyToOne(() => BOEElement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boeElementId' })
  boeElement!: BOEElement;

  @Column()
  boeVersionId!: string; // Link to BOE version for context

  @ManyToOne(() => BOEVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boeVersionId' })
  boeVersion!: BOEVersion;

  @Column({ nullable: true })
  vendorId?: string; // Vendor for this allocation (contract/PO)

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: Vendor;

  // Monthly breakdown (stored as JSON for flexibility)
  @Column('jsonb', { nullable: true })
  monthlyBreakdown!: {
    [month: string]: {
      amount: number;
      quantity?: number;
      date: string;
      isLocked: boolean;
      actualAmount?: number;
      actualQuantity?: number;
      actualDate?: string;
      notes?: string;
    };
  } | null;

  // Audit fields
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy!: string;

  // Helper methods
  getTotalAllocatedAmount(): number {
    if (!this.monthlyBreakdown) return 0;
    return Object.values(this.monthlyBreakdown).reduce(
      (sum, month) => sum + (month.amount || 0), 0
    );
  }

  getTotalActualAmount(): number {
    if (!this.monthlyBreakdown) return 0;
    return Object.values(this.monthlyBreakdown).reduce(
      (sum, month) => sum + (month.actualAmount || 0), 0
    );
  }

  getVariance(): number {
    return this.getTotalActualAmount() - this.getTotalAllocatedAmount();
  }

  getUtilizationPercentage(): number {
    const allocated = this.getTotalAllocatedAmount();
    if (allocated === 0) return 0;
    return (this.getTotalActualAmount() / allocated) * 100;
  }
} 