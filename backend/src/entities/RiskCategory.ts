import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Risk } from './Risk';
import { Opportunity } from './Opportunity';

export interface RiskCategoryData {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('risk_category')
export class RiskCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Risk, (risk) => risk.category)
  risks!: Risk[];

  @OneToMany(() => Opportunity, (opportunity) => opportunity.category)
  opportunities!: Opportunity[];

  // Helper methods
  toJSON(): RiskCategoryData {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      isSystem: this.isSystem,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

