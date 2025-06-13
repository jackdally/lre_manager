import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Program {
  @PrimaryGeneratedColumn()
  id!: number;

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
} 