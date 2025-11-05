import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Program } from './Program';

@Entity('program_setup_status')
export class ProgramSetupStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  programId!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'programId' })
  program!: Program;

  // Setup completion flags
  @Column({ default: false })
  boeCreated!: boolean;

  @Column({ default: false })
  boeApproved!: boolean;

  @Column({ default: false })
  boeBaselined!: boolean;

  @Column({ default: false })
  riskOpportunityRegisterCreated!: boolean;

  @Column({ default: false })
  initialMRSet!: boolean;

  @Column({ type: 'boolean', nullable: true, default: null })
  roAnalysisComplete!: boolean | null;

  @Column({ default: false })
  finalMRSet!: boolean;

  // Computed property - setup is complete when all steps are done
  // This is computed in the service, not stored in DB
  setupComplete!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

