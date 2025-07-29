import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ExchangeRate } from './ExchangeRate';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 3 })
  code!: string; // ISO 4217 currency code (USD, EUR, GBP, etc.)

  @Column({ length: 100 })
  name!: string; // Full currency name (US Dollar, Euro, etc.)

  @Column({ length: 10, nullable: true })
  symbol!: string; // Currency symbol ($, €, £, etc.)

  @Column({ default: false })
  isDefault!: boolean; // Whether this is the default/base currency

  @Column({ default: true })
  isActive!: boolean; // Whether this currency is available for use

  @Column({ type: 'int', default: 2 })
  decimalPlaces!: number; // Number of decimal places to display

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => ExchangeRate, exchangeRate => exchangeRate.baseCurrency)
  baseExchangeRates!: ExchangeRate[];

  @OneToMany(() => ExchangeRate, exchangeRate => exchangeRate.targetCurrency)
  targetExchangeRates!: ExchangeRate[];
} 