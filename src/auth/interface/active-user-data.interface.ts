import { Role } from '../enums/role.enum';

export interface ActiveUserData {
  /**
   * The ID of the user
   */
  sub: number;

  /**
   * User's phone
   */
  phone: string;

  /**
   * User's role
   */
  role: Role;

  /**
   * Optional session id for multi-device auth sessions
   */
  sid?: string;
}
