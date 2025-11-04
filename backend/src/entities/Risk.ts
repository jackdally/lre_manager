import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Program } from './Program';

/**
 * Risk entity for Phase 2 - Minimal implementation for R&O-Driven MR calculation
 * 
 * This is a minimal Risk entity created for Phase 2. A full R&O system implementation
 * will expand this entity with additional fields (status, ownership, response strategies, etc.)
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

  // Status (for filtering active risks)
  @Column({ default: 'Identified' })
  status!: string;

  // MR Utilization fields (Phase 3)
  @Column({ type: 'timestamp', nullable: true })
  materializedAt!: Date | null;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  mrUtilizedAmount!: number;

  @Column({ type: 'timestamp', nullable: true })
  mrUtilizationDate!: Date | null;

  @Column('text', { nullable: true })
  mrUtilizationReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedBy!: string | null;
}

