import { NotificationType, Priority, Status } from './enums';

export { NotificationType, Priority, Status };
export type UserPayload = { id: string; email: string };
export type JwtToken = { sub: string; exp: number };

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  userId: string;
  taskId: string;
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
