import { FailoverService } from "@app/service/failover/failover-service";

describe('FailoverService', () => {

  let service: FailoverService;

  beforeEach(() => {
    service = new FailoverService();
  });

  it('should start with 0 failures and 0 total requests', () => {
    expect(service.calculateFailureRate()).toBe(0);
    expect(service.isFailoverRequired()).toBe(false);
  });


  it('should increment failure count when a failure is recorded', () => {
    service.recordRequest();
    service.recordRequest();
    service.recordRequest();
    service.recordFailure();
    expect(service.calculateFailureRate()).toBe(0.25);
  });

  it('should require failover if failure rate is greater than or equal to 50%', () => {
    service.recordFailure();
    service.recordFailure();
    expect(service.isFailoverRequired()).toBe(true);
  });

  it('should not require failover if failure rate is 50% or lower', () => {
    service.recordRequest();
    expect(service.isFailoverRequired()).toBe(false);

    service.recordFailure();
    expect(service.isFailoverRequired()).toBe(false);
  });
});

