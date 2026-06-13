import { User } from '../user';

export interface InvitationCode {
  code: string;
  numberOfRedemptionsAllowed: number;
  expiredAt: string;
  enabled: boolean;
  /**
   * the users who have used the code, will only be available if the code is created on backend
   */
  users: string[] | User[];
  _id: string;
}
