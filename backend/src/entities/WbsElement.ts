import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Program } from './Program';

@Entity()
export class WbsElement {
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

  @ManyToOne(() => Program, { onDelete: 'CASCADE' })
  @JoinColumn()
  program!: Program;

  @ManyToOne(() => WbsElement, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: WbsElement;

  @OneToMany(() => WbsElement, element => element.parent)
  children!: WbsElement[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 