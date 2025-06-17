import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Program } from './Program';

@Entity()
export class WbsCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  program!: Program;

  @OneToMany('WbsSubcategory', 'category')
  subcategories!: any[];
} 