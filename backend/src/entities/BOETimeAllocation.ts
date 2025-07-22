import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BOEElement } from './BOEElement';
import { Program } from './Program';

@Entity()
export class BOETimeAllocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // e.g., "Software Development Contractor"

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount!: number; // Total contract amount (e.g., $100,000)

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

  // Relationships
  @Column({ nullable: true })
  boeElementId?: string; // Optional link to specific BOE element

  @ManyToOne(() => BOEElement, { nullable: true })
  @JoinColumn({ name: 'boeElementId' })
  boeElement?: BOEElement;

  @Column()
  programId!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program!: Program;

  // Monthly breakdown (stored as JSON for flexibility)
  @Column('jsonb', { nullable: true })
  monthlyBreakdown!: {
    [month: string]: {
      amount: number;
      date: string;
      isLocked: boolean;
      actualAmount?: number;
      actualDate?: string;
    };
  } | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy!: string;
} 