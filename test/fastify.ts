import { beforeAll, afterAll } from 'vitest'
import { app } from '@app/app'
import { VehicleValuation } from '@app/models/vehicle-valuation';

export const fastify = app()

beforeAll(async () => {
  // called once before all tests run
  await fastify.ready()

  // Get an actual repository instance
  const realRepository = fastify.orm.getRepository(VehicleValuation);

  // Spy on specific methods to override them
  vi.spyOn(realRepository, 'findOneBy').mockResolvedValue(null); // Default behavior
  vi.spyOn(realRepository, 'insert').mockResolvedValue({
    identifiers: [],
    generatedMaps: [],
    raw: undefined
  });

  // Assign the modified repository back to fastify.orm
  const mockDataSource = {
    getRepository: () => realRepository,
    destroy: vi.fn()
  };

  Object.assign(fastify, { orm: mockDataSource });

})
afterAll(async () => {
  // called once after all tests run
  await fastify.close()
})
