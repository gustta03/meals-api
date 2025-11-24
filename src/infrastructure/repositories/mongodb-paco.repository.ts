import { PacoItem } from "@domain/entities/paco-item.entity";
import { IPacoRepository } from "@domain/repositories/paco.repository";
import { MongoDBConnection } from "../database/mongodb.connection";
import { Collection } from "mongodb";
import { DATABASE } from "@shared/constants/database.constants";
import { logger } from "@shared/logger/logger";

interface PacoDocument {
  _id: string;
  nome: string;
  nomeAlternativo?: string[];
  energiaKcal: number;
  proteinaG: number;
  carboidratoG: number;
  lipidioG: number;
  porcaoPadraoG: number;
  unidade: "g" | "ml";
}

export class MongoDBPacoRepository implements IPacoRepository {
  private get collection(): Collection<PacoDocument> {
    return MongoDBConnection.getInstance()
      .getDatabase()
      .collection<PacoDocument>(DATABASE.COLLECTIONS.PACO_ITEMS);
  }

  async findById(id: string): Promise<PacoItem | null> {
    try {
      const doc = await this.collection.findOne({ _id: id });
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, id }, "Failed to find PACO item by id");
      throw new Error(`Failed to find PACO item by id: ${error}`);
    }
  }

  async findByName(name: string): Promise<PacoItem | null> {
    try {
      const normalizedName = name.toLowerCase().trim();
      
      // Tentativa 1: Busca exata
      let doc = await this.collection.findOne({
        $or: [
          { nome: { $regex: new RegExp(`^${normalizedName}$`, "i") } },
          { nomeAlternativo: { $in: [new RegExp(`^${normalizedName}$`, "i")] } },
        ],
      });
      
      if (doc) {
        return this.toEntity(doc);
      }

      // Tentativa 2: Busca parcial (contém)
      doc = await this.collection.findOne({
        $or: [
          { nome: { $regex: normalizedName, $options: "i" } },
          { nomeAlternativo: { $in: [new RegExp(normalizedName, "i")] } },
        ],
      });
      
      if (doc) {
        logger.debug({ originalName: name, foundAs: doc.nome }, "Found item with partial match");
        return this.toEntity(doc);
      }

      // Tentativa 3: Extrair termos principais e buscar
      const mainTerms = this.extractMainTerms(normalizedName);
      for (const term of mainTerms) {
        if (term.length < 3) continue; // Ignorar termos muito curtos
        
        doc = await this.collection.findOne({
          $or: [
            { nome: { $regex: new RegExp(`\\b${term}\\b`, "i") } },
            { nomeAlternativo: { $in: [new RegExp(`\\b${term}\\b`, "i")] } },
          ],
        });
        
        if (doc) {
          logger.debug({ originalName: name, foundAs: doc.nome, matchedTerm: term }, "Found item with main term match");
          return this.toEntity(doc);
        }
      }

      return null;
    } catch (error) {
      logger.error({ error, name }, "Failed to find PACO item by name");
      throw new Error(`Failed to find PACO item by name: ${error}`);
    }
  }

  private extractMainTerms(name: string): string[] {
    // Remove palavras comuns que não são alimentos
    const stopWords = ["ao", "de", "do", "da", "com", "sem", "ao", "molho", "picante", "grelhado", "frito", "cozido", "assado"];
    
    // Divide por espaços e remove stop words
    const words = name
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Retorna palavras principais (geralmente as primeiras são mais importantes)
    return words.slice(0, 2); // Pega as 2 primeiras palavras significativas
  }

  async search(searchTerm: string): Promise<PacoItem[]> {
    try {
      const normalizedSearch = searchTerm.toLowerCase().trim();
      const docs = await this.collection
        .find({
          $or: [
            { nome: { $regex: normalizedSearch, $options: "i" } },
            { nomeAlternativo: { $in: [new RegExp(normalizedSearch, "i")] } },
          ],
        })
        .limit(10)
        .toArray();
      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error, searchTerm }, "Failed to search PACO items");
      throw new Error(`Failed to search PACO items: ${error}`);
    }
  }

  async findAll(): Promise<PacoItem[]> {
    try {
      const docs = await this.collection.find({}).toArray();
      return docs.map((doc) => this.toEntity(doc));
    } catch (error) {
      logger.error({ error }, "Failed to find all PACO items");
      throw new Error(`Failed to find all PACO items: ${error}`);
    }
  }

  async save(item: PacoItem): Promise<PacoItem> {
    try {
      const doc = this.toDocument(item);
      await this.collection.insertOne(doc);
      return item;
    } catch (error) {
      logger.error({ error, itemId: item.id }, "Failed to save PACO item");
      throw new Error(`Failed to save PACO item: ${error}`);
    }
  }

  private toEntity(doc: PacoDocument): PacoItem {
    return PacoItem.create(
      doc._id,
      doc.nome,
      doc.energiaKcal,
      doc.proteinaG,
      doc.carboidratoG,
      doc.lipidioG,
      doc.porcaoPadraoG,
      doc.unidade,
      doc.nomeAlternativo
    );
  }

  private toDocument(item: PacoItem): PacoDocument {
    return {
      _id: item.id,
      nome: item.nome,
      nomeAlternativo: item.nomeAlternativo,
      energiaKcal: item.energiaKcal,
      proteinaG: item.proteinaG,
      carboidratoG: item.carboidratoG,
      lipidioG: item.lipidioG,
      porcaoPadraoG: item.porcaoPadraoG,
      unidade: item.unidade,
    };
  }
}

