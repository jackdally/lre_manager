import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BOETemplateElement } from './BOETemplateElement';

@Entity()
export class BOETemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column()
  category!: string; // e.g., 'Software Development', 'Construction', 'Research'

  @Column()
  version!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  @Column({ nullable: true })
  parentTemplateId?: string;

  @ManyToOne(() => BOETemplate, { nullable: true })
  @JoinColumn({ name: 'parentTemplateId' })
  parentTemplate?: BOETemplate;

  @OneToMany(() => BOETemplate, template => template.parentTemplate)
  childTemplates!: BOETemplate[];

  @OneToMany(() => BOETemplateElement, element => element.template)
  elements!: BOETemplateElement[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy!: string;

  @Column({ nullable: true })
  updatedBy!: string;
} 