export interface IPaginationInput {
  page?: number;
  limit?: number;
}

export interface IPaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: IPaginationInfo;
}

export interface ISortInput {
  field?: string;
  order?: 'ASC' | 'DESC';
}