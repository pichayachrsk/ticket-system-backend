export type SortOrder = 'asc' | 'desc';
export const defaultPageSize = 10;
export const defaultPage = 1;

export const enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export const enum Status {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export interface Ticket {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt?: string;
}
