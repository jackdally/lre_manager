import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Risk } from './Risk';

/**
 * RiskNote entity - Audit trail for risk notes
 * 
 * Enables history tracking of notes added to risks over time
 */
@Entity()
export class RiskNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Risk, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riskId' })
  risk!: Risk;

  @Column('text')
  note!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy!: string | null;
}

