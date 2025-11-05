import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Program } from './Program';
import { RiskCategory } from './RiskCategory';
import { WbsElement } from './WbsElement';
import { RiskNote } from './RiskNote';

/**
 * Risk entity - Full implementation for R&O management system
 * 
 * Includes comprehensive risk assessment, tracking, and MR utilization fields
 */
@Entity()
export class Risk {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program!: Program;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  // Category relationship
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => RiskCategory, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: RiskCategory;

  // Cost impact fields (required for MR calculation)
  @Column('decimal', { precision: 15, scale: 2 })
  costImpactMin!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  costImpactMostLikely!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  costImpactMax!: number;

  // Probability (0-100%)
  @Column('decimal', { precision: 5, scale: 2 })
  probability!: number;

  // Severity (required for MR calculation)
  @Column()
  severity!: 'Low' | 'Medium' | 'High' | 'Critical';

  // Status and disposition tracking
  @Column({ default: 'Identified' })
  status!: string;

  @Column({ 
    type: 'varchar',
    default: 'Identified'
  })
  disposition!: 'Identified' | 'In Progress' | 'Mitigated' | 'Realized' | 'Retired' | 'Transferred' | 'Accepted';

  @Column({ type: 'timestamp', nullable: true })
  dispositionDate!: Date | null;

  @Column('text', { nullable: true })
  dispositionReason!: string | null;

  // Ownership and dates
  @Column({ type: 'varchar', nullable: true })
  owner!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  identifiedDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  targetMitigationDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualMitigationDate!: Date | null;

  @Column('text', { nullable: true })
  mitigationStrategy!: string | null;

  // WBS Element linkage
  @Column({ nullable: true })
  wbsElementId?: string;

  @ManyToOne(() => WbsElement, { nullable: true })
  @JoinColumn({ name: 'wbsElementId' })
  wbsElement?: WbsElement;

  // MR Utilization fields
  @Column({ type: 'timestamp', nullable: true })
  materializedAt!: Date | null;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  mrUtilizedAmount!: number;

  @Column({ type: 'timestamp', nullable: true })
  mrUtilizationDate!: Date | null;

  @Column('text', { nullable: true })
  mrUtilizationReason!: string | null;

  // Notes relationship
  @OneToMany(() => RiskNote, (note) => note.risk)
  notes!: RiskNote[];

  // Audit fields
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedBy!: string | null;
}

