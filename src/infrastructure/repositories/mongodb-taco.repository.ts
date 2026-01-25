import { ITacoRepository } from "@domain/repositories/taco.repository";
import { TacoItem } from "@domain/entities/taco-item.entity";
import { MongoDBConnection } from "../database/mongodb.connection";
import { Collection } from "mongodb";
import { DATABASE } from "@shared/constants/database.constants";
import { logger } from "@shared/logger/logger";
import type { TacoItemDocument } from "../database/schemas/taco-item.schema";

export class MongoDBTacoRepository implements ITacoRepository {
  private get collection(): Collection<TacoItemDocument> {
    return MongoDBConnection.getInstance()
      .getDatabase()
      .collection<TacoItemDocument>(DATABASE.COLLECTIONS.TACO_ITEMS);
  }

  async findById(id: string): Promise<TacoItem | null> {
    try {
      const doc = await this.collection.findOne({ _id: id });
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, id }, "Failed to find TACO item by id");
      throw new Error(`Failed to find TACO item by id: ${error}`);
    }
  }

  async findByCodigo(codigo: string): Promise<TacoItem | null> {
    try {
      const doc = await this.collection.findOne({ codigo });
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, codigo }, "Failed to find TACO item by codigo");
      throw new Error(`Failed to find TACO item by codigo: ${error}`);
    }
  }

  async findByName(name: string): Promise<TacoItem | null> {
    try {
      const normalizedName = name.toLowerCase().trim();
      
      const doc = await this.collection.findOne({
        $or: [
          { nome: { $regex: new RegExp(`^${normalizedName}$`, "i") } },
          { searchableText: { $regex: new RegExp(`^${normalizedName}`, "i") } },
        ],
      });
      
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, name }, "Failed to find TACO item by name");
      throw new Error(`Failed to find TACO item by name: ${error}`);
    }
  }

  async search(query: string, limit: number = 10): Promise<TacoItem[]> {
    try {
      const normalizedQuery = query.toLowerCase().trim();
      
      const docs = await this.collection
        .find({
          $or: [
            { nome: { $regex: normalizedQuery, $options: "i" } },
            { searchableText: { $regex: normalizedQuery, $options: "i" } },
            { grupo: { $regex: normalizedQuery, $options: "i" } },
          ],
        })
        .limit(limit)
        .toArray();
      
      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error, query }, "Failed to search TACO items");
      throw new Error(`Failed to search TACO items: ${error}`);
    }
  }

  async findByGrupo(grupo: string): Promise<TacoItem[]> {
    try {
      const docs = await this.collection
        .find({ grupo: { $regex: grupo, $options: "i" } })
        .toArray();
      
      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error, grupo }, "Failed to find TACO items by grupo");
      throw new Error(`Failed to find TACO items by grupo: ${error}`);
    }
  }

  async findAll(limit: number = 100, skip: number = 0): Promise<TacoItem[]> {
    try {
      const docs = await this.collection
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();
      
      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error }, "Failed to find all TACO items");
      throw new Error(`Failed to find all TACO items: ${error}`);
    }
  }

  private toEntity(doc: TacoItemDocument): TacoItem {
    return TacoItem.create({
      id: doc._id,
      codigo: doc.codigo,
      nome: doc.nome,
      nomeCientifico: doc.nomeCientifico,
      grupo: doc.grupo,
      marca: doc.marca,
      energiaKcal: doc.energiaKcal,
      energiaKj: doc.energiaKj,
      umidade: doc.umidade,
      proteinaG: doc.proteinaG,
      lipidioG: doc.lipidioG,
      colesterolMg: doc.colesterolMg,
      carboidratoG: doc.carboidratoG,
      fibraAlimentarG: doc.fibraAlimentarG,
      cinzasG: doc.cinzasG,
      calcioMg: doc.calcioMg,
      magnesioMg: doc.magnesioMg,
      manganesMg: doc.manganesMg,
      fosforoMg: doc.fosforoMg,
      ferroMg: doc.ferroMg,
      sodioMg: doc.sodioMg,
      potassioMg: doc.potassioMg,
      cobreMg: doc.cobreMg,
      zincoMg: doc.zincoMg,
      retinolMcg: doc.retinolMcg,
      reMcg: doc.reMcg,
      raeMcg: doc.raeMcg,
      tiaminaMg: doc.tiaminaMg,
      riboflavinaMg: doc.riboflavinaMg,
      piridoxinaMg: doc.piridoxinaMg,
      niacinaMg: doc.niacinaMg,
      vitaminaCMg: doc.vitaminaCMg,
      porcaoPadraoG: doc.porcaoPadraoG,
      unidade: doc.unidade,
    });
  }
}
