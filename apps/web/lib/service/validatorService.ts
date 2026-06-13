'use server';
import { CreatedValidatorDto, CreateValidatorDto, Validator } from '../../types/validators';
import { fetchWithAuth } from './index';

export const getMyValidators = async () => {
  return await fetchWithAuth<Validator[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/validators/my`,
    {
      method: 'GET',
    },
  );
};

export const createValidator = async (validatorData: CreateValidatorDto) => {
  return await fetchWithAuth<CreatedValidatorDto>(
    `${process.env.NEXT_PUBLIC_API_URL}/validators/register`,
    {
      method: 'POST',
      body: JSON.stringify(validatorData),
    },
  );
};
