import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { WbsCategory } from './WbsCategory';

@Entity()
export class WbsSubcategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => WbsCategory, category => category.subcategories, { onDelete: 'CASCADE' })
  category!: WbsCategory;
} 