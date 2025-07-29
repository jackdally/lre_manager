import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { WbsTemplate } from './WbsTemplate';

@Entity()
export class WbsTemplateElement {
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
  parentId?: string;

  @ManyToOne(() => WbsTemplate, template => template.elements, { onDelete: 'CASCADE' })
  @JoinColumn()
  template!: WbsTemplate;

  @ManyToOne(() => WbsTemplateElement, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: WbsTemplateElement;

  @OneToMany(() => WbsTemplateElement, element => element.parent)
  children!: WbsTemplateElement[];
} 