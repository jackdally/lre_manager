import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BOETemplate } from './BOETemplate';
import { CostCategory } from './CostCategory';

@Entity()
export class BOETemplateElement {
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

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  estimatedCost!: number | null;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  managementReservePercentage!: number | null;

  @Column({ default: true })
  isRequired!: boolean;

  @Column({ default: false })
  isOptional!: boolean;

  @Column('text', { nullable: true })
  notes!: string | null;

  @ManyToOne(() => BOETemplate, { onDelete: 'CASCADE' })
  @JoinColumn()
  template!: BOETemplate;

  @ManyToOne(() => BOETemplateElement, { nullable: true })
  @JoinColumn({ name: 'parentElementId' })
  parentElement?: BOETemplateElement;

  @OneToMany(() => BOETemplateElement, element => element.parentElement)
  childElements!: BOETemplateElement[];

  @ManyToOne(() => CostCategory, { nullable: true })
  @JoinColumn({ name: 'costCategoryId' })
  costCategory?: CostCategory;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 