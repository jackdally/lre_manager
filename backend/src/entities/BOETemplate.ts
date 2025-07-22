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
  version!: string; // Semantic versioning (e.g., '1.0', '1.1', '2.0')

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isDefault!: boolean;

  // Versioning fields
  @Column({ nullable: true })
  parentTemplateId?: string; // Points to the previous version

  @Column({ nullable: true })
  rootTemplateId?: string; // Points to the original template (for version history)

  @Column({ default: 1 })
  majorVersion!: number; // Major version number (1, 2, 3...)

  @Column({ default: 0 })
  minorVersion!: number; // Minor version number (0, 1, 2...)

  @Column({ default: 0 })
  patchVersion!: number; // Patch version number (0, 1, 2...)

  @Column({ default: false })
  isLatestVersion!: boolean; // Indicates if this is the latest version

  @Column('text', { nullable: true })
  versionNotes?: string; // Notes about what changed in this version

  @Column('text', { nullable: true })
  changeLog?: string; // Detailed change log for this version

  // Permissions and sharing fields
  @Column({ default: false })
  isPublic!: boolean; // Whether template is available to all users

  @Column('simple-array', { nullable: true })
  sharedWithUsers?: string[]; // Array of user IDs who have access

  @Column('simple-array', { nullable: true })
  sharedWithRoles?: string[]; // Array of role names who have access

  @Column({ default: 'Private' })
  accessLevel!: 'Private' | 'Shared' | 'Public'; // Access level enum

  @Column({ default: false })
  allowCopy!: boolean; // Whether others can copy this template

  @Column({ default: false })
  allowModify!: boolean; // Whether others can modify this template

  // Relationships
  @ManyToOne(() => BOETemplate, { nullable: true })
  @JoinColumn({ name: 'parentTemplateId' })
  parentTemplate?: BOETemplate;

  @ManyToOne(() => BOETemplate, { nullable: true })
  @JoinColumn({ name: 'rootTemplateId' })
  rootTemplate?: BOETemplate;

  @OneToMany(() => BOETemplate, template => template.parentTemplate)
  childTemplates!: BOETemplate[];

  @OneToMany(() => BOETemplate, template => template.rootTemplate)
  versionHistory!: BOETemplate[];

  @OneToMany(() => BOETemplateElement, element => element.template)
  elements!: BOETemplateElement[];

  // Audit fields
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @Column({ type: 'varchar', nullable: true })
  createdBy!: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedBy!: string | null;

  // Helper methods for version management
  getFullVersion(): string {
    return `${this.majorVersion}.${this.minorVersion}.${this.patchVersion}`;
  }

  isCompatibleWith(otherVersion: BOETemplate): boolean {
    return this.majorVersion === otherVersion.majorVersion;
  }

  isNewerThan(otherVersion: BOETemplate): boolean {
    if (this.majorVersion !== otherVersion.majorVersion) {
      return this.majorVersion > otherVersion.majorVersion;
    }
    if (this.minorVersion !== otherVersion.minorVersion) {
      return this.minorVersion > otherVersion.minorVersion;
    }
    return this.patchVersion > otherVersion.patchVersion;
  }
} 