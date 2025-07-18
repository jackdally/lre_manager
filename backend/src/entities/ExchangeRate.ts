import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Currency } from './Currency';

@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  baseCurrencyId!: string; // Base currency (e.g., USD)

  @Column({ type: 'uuid' })
  targetCurrencyId!: string; // Target currency (e.g., EUR)

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  rate!: number; // Exchange rate (e.g., 0.85 for USD to EUR)

  @Column({ type: 'date' })
  effectiveDate!: Date; // Date when this rate is effective

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date; // When this rate expires (null = current rate)

  @Column({ default: false })
  isManual!: boolean; // Whether this rate was manually entered vs API

  @Column({ length: 500, nullable: true })
  source!: string; // Source of the exchange rate (API provider, manual, etc.)

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Currency, currency => currency.baseExchangeRates)
  @JoinColumn({ name: 'baseCurrencyId' })
  baseCurrency!: Currency;

  @ManyToOne(() => Currency, currency => currency.targetExchangeRates)
  @JoinColumn({ name: 'targetCurrencyId' })
  targetCurrency!: Currency;
} 