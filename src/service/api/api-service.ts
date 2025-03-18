// api-service.ts
import { fetchValuationFromSuperCarValuation } from '@app/super-car/super-car-valuation';
import { fetchValuationFromPremiumCarValuation } from '@app/premium-car/premium-car-valuations';
import { FailoverService } from '../failover/failover-service';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { BothServicesDownError, SuperCarError } from '@app/errors/errors';

export class APIService {
  private failoverService: FailoverService;

  constructor(failoverService: FailoverService) {
    this.failoverService = failoverService;
  }

  public async getValuation(vrm: string, mileage: number): Promise<VehicleValuation | undefined> {
    let valuation: VehicleValuation | undefined;

    try {
      valuation = await fetchValuationFromSuperCarValuation(vrm, mileage);
    } catch (error) {
      this.failoverService.recordFailure();

      if (!this.failoverService.isFailoverRequired()) {
        throw new SuperCarError('Error fetching valuation from Supercar');
      }

      try {
        valuation = await fetchValuationFromPremiumCarValuation(vrm);
      } catch (premiumError) {
        throw new BothServicesDownError('Error fetching valuation from both Supercar and Premium Car');
      }
    }
    
    return valuation;
  }
}
