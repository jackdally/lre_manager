import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BOEVersion } from './BOEVersion';

@Entity()
export class BOEApproval {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  approvalLevel!: number; // 1, 2, 3, etc.

  @Column()
  approverRole!: string; // e.g., 'Program Manager', 'Finance Director', 'Executive'

  @Column({ nullable: true })
  approverName?: string;

  @Column({ nullable: true })
  approverEmail?: string;

  @Column()
  status!: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column('text', { nullable: true })
  comments?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column({ default: false })
  isRequired!: boolean;

  @Column({ default: false })
  isOptional!: boolean;

  @Column({ default: 0 })
  sequenceOrder!: number;

  @ManyToOne(() => BOEVersion, { onDelete: 'CASCADE' })
  @JoinColumn()
  boeVersion!: BOEVersion;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 