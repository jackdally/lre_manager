import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Program } from './Program';
import { RiskCategory } from './RiskCategory';
import { WbsElement } from './WbsElement';
import { OpportunityNote } from './OpportunityNote';

/**
 * Opportunity entity - Full implementation for opportunity management
 * 
 * Mirrors Risk entity structure but for positive outcomes (benefits, cost savings, etc.)
 */
@Entity()
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program!: Program;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  // Category relationship (shared with Risk)
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => RiskCategory, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: RiskCategory;

  // Benefit fields (financial benefit estimation)
  @Column('decimal', { precision: 15, scale: 2 })
  benefitMin!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  benefitMostLikely!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  benefitMax!: number;

  // Probability (0-100%)
  @Column('decimal', { precision: 5, scale: 2 })
  probability!: number;

  // Benefit Severity
  @Column()
  benefitSeverity!: 'Low' | 'Medium' | 'High' | 'Critical';

  // Status and disposition tracking
  @Column({ default: 'Identified' })
  status!: string;

  @Column({ 
    type: 'varchar',
    default: 'Identified'
  })
  disposition!: 'Identified' | 'In Progress' | 'Realized' | 'Retired' | 'Deferred' | 'Lost';

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
  targetRealizationDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualRealizationDate!: Date | null;

  @Column('text', { nullable: true })
  realizationStrategy!: string | null;

  // Actual benefit when realized
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  actualBenefit!: number | null;

  // WBS Element linkage
  @Column({ nullable: true })
  wbsElementId?: string;

  @ManyToOne(() => WbsElement, { nullable: true })
  @JoinColumn({ name: 'wbsElementId' })
  wbsElement?: WbsElement;

  // Notes relationship
  @OneToMany(() => OpportunityNote, (note) => note.opportunity)
  notes!: OpportunityNote[];

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

