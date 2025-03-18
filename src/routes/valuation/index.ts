import { FastifyInstance } from 'fastify';
import { VehicleValuationRequest } from './types/vehicle-valuation-request';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { APIService } from '@app/service/api/api-service';
import { BothServicesDownError, SuperCarError } from '@app/errors/errors';
import { FailoverService } from '@app/service/failover/failover-service';

export function valuationRoutes(fastify: FastifyInstance) {
  const failoverService = new FailoverService();
  const apiService = new APIService(failoverService);

  fastify.get<{
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;

    if (!vrm || vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    const result = await valuationRepository.findOneBy({ vrm: vrm });

    if (result == null) {
      return reply.code(404).send({
        message: `Valuation for VRM ${vrm} not found`,
        statusCode: 404,
      });
    }

    return result;
  });

  fastify.put<{
    Body: VehicleValuationRequest;
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;
    const { mileage } = request.body;

    if (vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    if (mileage === null || mileage <= 0) {
      return reply.code(400).send({
        message: 'mileage must be a positive number',
        statusCode: 400,
      });
    }

    // Ideally this sort of thing would not be done on this level. Rather we'd have separate controller and service level 
    // methods. The controller be the entry point for the route, handle some mapping to http status codes, and calling the
    // service method. The service would then call the data repository and handle all the business logic. I struggled a bit
    // with the mocking here though within the timeframe, so I've left it here for now
    const databaseVRM = await valuationRepository.findOneBy({ vrm: vrm });
    if (databaseVRM) {
      return databaseVRM;
    }

    let valuation;

    try {
      valuation = await apiService.getValuation(vrm, mileage);
    } catch (error) {
      if (error instanceof SuperCarError) {
        // We could implement some retry logic here, I feel that a 503 is actually the best error here too, but in lieu
        // of direction here in the brief, I am just rethrowing for now
        throw error;
      } else if (error instanceof BothServicesDownError) {
        return reply.code(503).send({
          message: 'Valuation services not available',
          statusCode: 403,
        });
      } else {
        return reply.code(500).send({
          message: 'Unexpected server error',
          statusCode: 500,
        });
      }
    }

    if (!valuation) {
      return reply.code(404).send({
        message: 'vehicle VRM not found',
        statusCode: 404,
      });
    }

    await valuationRepository.insert(valuation).catch((err) => {
      if (err.code !== 'SQLITE_CONSTRAINT') {
        throw err;
      }
    });

    fastify.log.info('Valuation created: ', valuation);

    return valuation;
  });
}
