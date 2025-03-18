import { BothServicesDownError, SuperCarError } from "@app/errors/errors";
import { fetchValuationFromPremiumCarValuation } from "@app/premium-car/premium-car-valuations";
import { APIService } from "@app/service/api/api-service";
import { FailoverService } from "@app/service/failover/failover-service";
import { fetchValuationFromSuperCarValuation } from "@app/super-car/super-car-valuation";
import { Mock } from "vitest";

vi.mock('@app/super-car/super-car-valuation', () => ({
  fetchValuationFromSuperCarValuation: vi.fn(),
}));

vi.mock('@app/premium-car/premium-car-valuations', () => ({
  fetchValuationFromPremiumCarValuation: vi.fn(),
}));


describe('APIService', async () => {

  let apiService: APIService
  let failoverService: FailoverService;

  beforeEach(() => {
    failoverService = {
      recordFailure: vi.fn(),
      recordRequest: vi.fn(),
      isFailoverRequired: vi.fn(),
    } as unknown as FailoverService;
    apiService = new APIService(failoverService);
  });

  it('should return valuation from SuperCar if there are no errors', async () => {
    const vrm = 'ABC123';
    const mileage = 5000;
    const databaseValuation = {
      "mileage": 5000,
      "value": 20000,
      "vrm": "ABC123",
    };
    
    (fetchValuationFromSuperCarValuation as Mock).mockResolvedValue(databaseValuation);

    const result = await apiService.getValuation(vrm, mileage);
    expect(result).toEqual(databaseValuation);
  });

  it('throws a SuperCarError error if SuperCar fails but the failover threshold is not yet met', async () => {
    const vrm = 'ABC123';
    const mileage = 5000;
    
    (fetchValuationFromSuperCarValuation as Mock).mockRejectedValue(new Error('SuperCar Error'));
    (failoverService.isFailoverRequired as Mock).mockReturnValue(false);
    
    await expect(apiService.getValuation(vrm, mileage)).rejects.toThrow(SuperCarError);
  });

  it('should query PremiumCar if SuperCar fails and the failover threshold is met', async () => {
    const vrm = 'ABC123';
    const mileage = 5000;
    const premiumValuation = { vrm, mileage, value: 18000 };
    
    (fetchValuationFromSuperCarValuation as Mock).mockRejectedValue(new Error('SuperCar Error'));
    (failoverService.isFailoverRequired as Mock).mockReturnValue(true);
    (fetchValuationFromPremiumCarValuation as Mock).mockResolvedValue(premiumValuation);
    
    const result = await apiService.getValuation(vrm, mileage);
    expect(result).toEqual(premiumValuation);
  });

  it('should throw BothServicesDownError if both services fail', async () => {
    const vrm = 'ABC123';
    const mileage = 5000;
    
    (fetchValuationFromSuperCarValuation as Mock).mockRejectedValue(new Error('SuperCar Error'));
    (failoverService.isFailoverRequired as Mock).mockReturnValue(true);
    (fetchValuationFromPremiumCarValuation as Mock).mockRejectedValue(new Error('PremiumCar Error'));
    
    await expect(apiService.getValuation(vrm, mileage)).rejects.toThrow(BothServicesDownError);
  });

  it('should still hit SuperCar as a first pass even when the failover threshold is met', async () => {
    const vrm = 'ABC123';
    const mileage = 5000;
    const superCarValuation = { vrm, mileage, value: 20000 };
    
    (fetchValuationFromSuperCarValuation as Mock).mockResolvedValue(superCarValuation);
    (failoverService.isFailoverRequired as Mock).mockReturnValue(true);
    
    const result = await apiService.getValuation(vrm, mileage);
    expect(result).toEqual(superCarValuation);
  });
});