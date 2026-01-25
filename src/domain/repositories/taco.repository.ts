import { TacoItem } from "@domain/entities/taco-item.entity";

export interface ITacoRepository {
  findById(id: string): Promise<TacoItem | null>;
  findByCodigo(codigo: string): Promise<TacoItem | null>;
  findByName(name: string): Promise<TacoItem | null>;
  search(query: string, limit?: number): Promise<TacoItem[]>;
  findByGrupo(grupo: string): Promise<TacoItem[]>;
  findAll(limit?: number, skip?: number): Promise<TacoItem[]>;
}
