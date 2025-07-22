import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BOEVersion } from './BOEVersion';
import { CostCategory } from './CostCategory';
import { Vendor } from './Vendor';

@Entity()
export class BOEElement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  level!: number;

  @Column({ nullable: true })
  parentElementId?: string;

  @Column({ nullable: true })
  costCategoryId?: string;

  @Column({ nullable: true })
  vendorId?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  estimatedCost!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  actualCost!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  variance!: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  managementReservePercentage!: number | null;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  managementReserveAmount!: number;

  @Column({ default: true })
  isRequired!: boolean;

  @Column({ default: false })
  isOptional!: boolean;

  @Column('text', { nullable: true })
  notes!: string | null;

  @Column('text', { nullable: true })
  assumptions!: string | null;

  @Column('text', { nullable: true })
  risks!: string | null;

  @ManyToOne(() => BOEVersion, { onDelete: 'CASCADE' })
  @JoinColumn()
  boeVersion!: BOEVersion;

  @ManyToOne(() => BOEElement, { nullable: true })
  @JoinColumn({ name: 'parentElementId' })
  parentElement?: BOEElement;

  @OneToMany(() => BOEElement, element => element.parentElement)
  childElements!: BOEElement[];

  @ManyToOne(() => CostCategory, { nullable: true })
  @JoinColumn({ name: 'costCategoryId' })
  costCategory?: CostCategory;

  @ManyToOne(() => Vendor, { nullable: true })
  @JoinColumn({ name: 'vendorId' })
  vendor?: Vendor;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 