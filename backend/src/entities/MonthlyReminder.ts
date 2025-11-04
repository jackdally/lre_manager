import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Program } from './Program';

@Entity('monthly_reminders')
export class MonthlyReminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  programId!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program!: Program;

  @Column({ type: 'varchar', length: 7 })
  month!: string; // Format: YYYY-MM

  @Column({ default: false })
  isDismissed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dismissedBy?: string;

  @Column({ default: false })
  emailSent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt?: Date;

  @Column({ default: false })
  inAppNotificationShown!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  inAppNotificationShownAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

