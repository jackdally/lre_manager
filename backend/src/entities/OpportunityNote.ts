import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Opportunity } from './Opportunity';

/**
 * OpportunityNote entity - Audit trail for opportunity notes
 * 
 * Enables history tracking of notes added to opportunities over time
 */
@Entity()
export class OpportunityNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Opportunity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunityId' })
  opportunity!: Opportunity;

  @Column('text')
  note!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy!: string | null;
}

