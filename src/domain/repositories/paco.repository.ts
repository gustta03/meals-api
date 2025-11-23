import { PacoItem } from "@domain/entities/paco-item.entity";

export interface IPacoRepository {
  findById(id: string): Promise<PacoItem | null>;
  findByName(name: string): Promise<PacoItem | null>;
  search(searchTerm: string): Promise<PacoItem[]>;
  findAll(): Promise<PacoItem[]>;
  save(item: PacoItem): Promise<PacoItem>;
}

