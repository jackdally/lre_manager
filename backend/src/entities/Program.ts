import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BOEVersion } from './BOEVersion';

@Entity()
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  status!: string;

  @Column({ type: 'timestamp', nullable: true })
  startDate!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endDate!: Date | null;

  @Column('decimal', { precision: 15, scale: 2 })
  totalBudget!: number;

  @Column()
  type!: 'Annual' | 'Period of Performance';

  @Column({ type: 'varchar', nullable: true })
  program_manager!: string | null;

  // BOE-related fields
  @Column({ nullable: true })
  currentBOEVersionId?: string;

  @Column({ nullable: true })
  boeTemplateId?: string;

  @Column({ default: false })
  hasBOE!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastBOEUpdate?: Date;

  @OneToMany(() => BOEVersion, boeVersion => boeVersion.program)
  boeVersions!: BOEVersion[];
} 