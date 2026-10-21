export interface Item {
  readonly id: string;
  readonly name: string;
}

export interface ListItemsQuery {
  readonly page: number;
  readonly perPage: number;
}

export interface ListItemsResult {
  readonly records: readonly Item[];
  readonly pagination: {
    readonly page: number;
    readonly perPage: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}
