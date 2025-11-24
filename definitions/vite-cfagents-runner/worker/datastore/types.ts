export interface ListOptions {
  cursor?: string | null;
  limit?: number;
}

export interface PageResult<T> {
  items: T[];
  next: string | null;
}

export interface WriteOptions {
  id?: string;
}

export interface DataStore {
  list<T>(collection: string, options?: ListOptions): Promise<PageResult<T>>;
  get<T>(collection: string, id: string): Promise<T | null>;
  create<T extends { id?: string }>(
    collection: string,
    document: T,
    options?: WriteOptions
  ): Promise<T>;
  update<T>(
    collection: string,
    id: string,
    document: Partial<T>
  ): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
}

