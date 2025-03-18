import { fastify } from '~root/test/fastify';
import { VehicleValuationRequest } from '../types/vehicle-valuation-request';
import { fetchValuationFromSuperCarValuation } from '../../../super-car/super-car-valuation';
import { Mock, MockedFunction } from 'vitest';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { VehicleProvider } from '@app/enum/enum';
import { fetchValuationFromPremiumCarValuation } from '@app/premium-car/premium-car-valuations';

vi.mock('@app/super-car/super-car-valuation', () => ({
  fetchValuationFromSuperCarValuation: vi.fn(),
}));

vi.mock('@app/premium-car/premium-car-valuations', () => ({
  fetchValuationFromPremiumCarValuation: vi.fn(),
}));

describe('ValuationController (e2e)', () => {
  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 503 when both services are down and failover is enabled', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      (fetchValuationFromSuperCarValuation as Mock).mockRejectedValue(new Error('SuperCar Error'));
      (fetchValuationFromPremiumCarValuation as Mock).mockRejectedValue(new Error('PremiumCar Error'));

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(503);
    });

    it('should return 200 with valid request', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      (fetchValuationFromSuperCarValuation as MockedFunction<
        typeof fetchValuationFromSuperCarValuation
        >).mockResolvedValue({
          vrm: 'ABC123',
          lowestValue: 10,
          highestValue: 1000000,
          midpointValue: 5000000,
          providerText: "hello",
          provider: VehicleProvider.PremiumCar,
          providerEnum: null
        });

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
    });
  });

  describe('GET /valuations/', () => {
    it('should return 400 if VRM is empty', async () => {

      const res = await fastify.inject({
        url: '/valuations/',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if VRM is too long', async () => {

      const res = await fastify.inject({
        url: '/valuations/ABC1234567',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 when a car is found for the relevant VRM', async () => {
      const mockFindOneBy = fastify.orm.getRepository(VehicleValuation).findOneBy as Mock;
      mockFindOneBy.mockResolvedValue({ vrm: 'ABC123', value: 10000 });

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);
    });

    it('should return 404 when a car is found for the relevant VRM', async () => {
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
