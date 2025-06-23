import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Program } from './Program';

@Entity()
export class ImportConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column('json')
  columnMapping!: {
    programCodeColumn: string;
    vendorColumn: string;
    descriptionColumn: string;
    amountColumn: string;
    dateColumn: string;
    categoryColumn?: string;
    subcategoryColumn?: string;
    invoiceColumn?: string;
    referenceColumn?: string;
    dateFormat?: string;
    amountTolerance?: number;
    matchThreshold?: number;
  };

  @Column('boolean', { default: false })
  isDefault!: boolean;

  @Column('boolean', { default: false })
  isGlobal!: boolean;

  @ManyToOne(() => Program, { onDelete: 'CASCADE', nullable: true })
  program!: Program | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 