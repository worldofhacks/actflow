import { TransactionInfoDocument } from '../../agents/schemas/transaction-info.schema';
import { ValidatorMetadata } from '../types/validator-metadata';

export class ValidatorDomainModel {
  constructor(
    public readonly id: string,
    public readonly validatorId: string,
    public readonly metadata: ValidatorMetadata,
    public readonly expireAtTs: number,
    public readonly topics: string[],
    public readonly isBlockchainConfirmed: boolean,
    public readonly creationTransaction?: TransactionInfoDocument,
  ) {}

  public static createEmpty(): ValidatorDomainModel {
    return new ValidatorDomainModel('', '', '', 0, [], false);
  }
}
