import axios from 'axios';

import { VehicleValuation } from '../models/vehicle-valuation';
import { PremiumCarValuationResponse } from './types/premium-car-valuation-response';
import { parseStringPromise } from 'xml2js';
import { VehicleProvider } from '@app/enum/enum';

export async function fetchValuationFromPremiumCarValuation(
  vrm: string,
): Promise<VehicleValuation> {
  console.log('hi')
  axios.defaults.baseURL =
    'https://run.mocky.io/v3/0dfda26a-3a5a-43e5-b68c-51f148eda473';
  const response = await axios.get<PremiumCarValuationResponse>(
    `valuations/${vrm}`,
    {
      headers: {
        Accept: 'application/xml',
      },
    },
  );

  const parsedData = await parseStringPromise(response.data);

  const valuation = new VehicleValuation();

  valuation.vrm = vrm;
  valuation.lowestValue = parsedData.Response.ValuationPrivateSaleMinimum;
  valuation.highestValue = parsedData.Response.ValuationPrivateSaleMaximum;
  valuation.provider = VehicleProvider.PremiumCar;

  return valuation;
}
