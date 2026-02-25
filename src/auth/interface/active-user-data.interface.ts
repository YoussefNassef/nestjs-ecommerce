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
}
