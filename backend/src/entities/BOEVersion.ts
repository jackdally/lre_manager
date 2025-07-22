import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Program } from './Program';
import { BOEElement } from './BOEElement';
import { BOEApproval } from './BOEApproval';

@Entity()
export class BOEVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  versionNumber!: string; // e.g., "1.0", "1.1", "2.0"

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  status!: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Archived' | 'Baseline' | 'PushedToProgram';

  @Column({ nullable: true })
  templateId?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  totalEstimatedCost!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  managementReserveAmount!: number;

  @Column('decimal', { precision: 5, scale: 2 })
  managementReservePercentage!: number;

  @Column('text', { nullable: true })
  changeSummary!: string | null;

  @Column('text', { nullable: true })
  justification!: string | null;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  rejectedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn()
  program!: Program;

  @OneToMany(() => BOEElement, element => element.boeVersion)
  elements!: BOEElement[];

  @OneToMany(() => BOEApproval, approval => approval.boeVersion)
  approvals!: BOEApproval[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy!: string;
} 