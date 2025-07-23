import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BOEVersion } from './BOEVersion';

@Entity()
export class BOEComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  boeVersionId!: string;

  @Column()
  commentType!: 'Review' | 'Approval' | 'Rejection' | 'General' | 'Revision' | 'Clarification';

  @Column('text')
  comment!: string;

  @Column()
  authorName!: string;

  @Column()
  authorRole!: string; // e.g., 'Program Manager', 'Finance Director', 'Reviewer'

  @Column({ nullable: true })
  authorEmail?: string;

  @Column({ default: false })
  isInternal!: boolean; // for internal vs external comments

  @Column({ default: false })
  isResolved!: boolean; // track if comment has been addressed

  @Column({ nullable: true })
  resolvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column('text', { nullable: true })
  resolutionNotes?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => BOEVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boeVersionId' })
  boeVersion!: BOEVersion;
} 