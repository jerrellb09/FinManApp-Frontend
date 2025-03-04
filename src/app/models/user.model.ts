export interface User {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: any;
}