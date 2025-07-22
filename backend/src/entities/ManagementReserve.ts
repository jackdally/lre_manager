import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BOEVersion } from './BOEVersion';

@Entity()
export class ManagementReserve {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  baselineAmount!: number;

  @Column('decimal', { precision: 5, scale: 2 })
  baselinePercentage!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  adjustedAmount!: number;

  @Column('decimal', { precision: 5, scale: 2 })
  adjustedPercentage!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  utilizedAmount!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  remainingAmount!: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  utilizationPercentage!: number;

  @Column()
  calculationMethod!: 'Standard' | 'Risk-Based' | 'Custom';

  @Column('text', { nullable: true })
  justification!: string | null;

  @Column('text', { nullable: true })
  riskFactors!: string | null;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => BOEVersion, { onDelete: 'CASCADE' })
  @JoinColumn()
  boeVersion!: BOEVersion;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy!: string;
} 