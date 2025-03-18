import { VehicleProvider } from '@app/enum/enum';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class VehicleValuation {
  @PrimaryColumn({ length: 7 })
  vrm: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lowestValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  highestValue: number;

  // Ideally here we'd add a separate table in the database called providers, and this be a FK to that table.
  // This sort of approach is beneficial for any data products wwe might sell in future.
  // I've gone with something a little simpler though to save time for now.
  @Column({
    type: 'varchar',
    nullable: true,
  })
  provider: string | null;

  // Getter for transformed provider value
  get providerText(): string | null {
    switch (this.provider) {
      case VehicleProvider.PremiumCar:
        return 'Valued by Trusted Company Premium Car';
      case VehicleProvider.SuperCar:
        return 'Valued by Trusted Company Super Car';
      default:
        return 'Motorway legacy valuation';
    }
  }

  set providerEnum(value: VehicleProvider | null) {
    this.provider = value ? value : null;
  }

  get midpointValue(): number {
    return (this.highestValue + this.lowestValue) / 2;
  }
}
