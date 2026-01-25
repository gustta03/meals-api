import XLSX from "xlsx";
import { MongoDBConnection } from "../infrastructure/database/mongodb.connection";
import { DATABASE } from "../shared/constants/database.constants";
import { logger } from "../shared/logger/logger";
import type { TacoItemDocument } from "../infrastructure/database/schemas/taco-item.schema";
import { generateUUID } from "../shared/utils/uuid";

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === "" || value === "NA" || value === "Tr") {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseString(value: any): string | undefined {
  if (value === null || value === undefined || value === "" || value === "NA") {
    return undefined;
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? value.trim() : undefined;
  }
  return String(value).trim();
}

function createSearchableText(nome: string, grupo?: string, marca?: string): string {
  const parts: string[] = [nome.toLowerCase()];
  if (grupo) parts.push(grupo.toLowerCase());
  if (marca) parts.push(marca.toLowerCase());
  return parts.join(" ");
}

async function importTacoData(): Promise<void> {
  const connection = MongoDBConnection.getInstance();
  
  try {
    logger.info("Connecting to MongoDB...");
    await connection.connect();
    
    const db = connection.getDatabase();
    const collection = db.collection<TacoItemDocument>(DATABASE.COLLECTIONS.TACO_ITEMS);
    
    logger.info("Clearing existing TACO data...");
    await collection.deleteMany({});
    
    logger.info("Reading Excel file...");
    const filePath = process.env.TACO_EXCEL_PATH || "/home/gustavo/Downloads/Taco-4a-Edicao.xlsx";
    
    if (!filePath) {
      throw new Error("TACO Excel file path not provided. Set TACO_EXCEL_PATH environment variable or place file at default location.");
    }
    
    logger.info({ filePath }, "Reading TACO Excel file");
    
    let workbook;
    try {
      workbook = XLSX.readFile(filePath);
    } catch (fileError) {
      logger.error(
        { 
          error: fileError, 
          filePath,
          hint: "Make sure the Excel file exists at the specified path. For Docker, place it in ./taco-data/ folder and set TACO_EXCEL_PATH=/app/taco-data/Taco-4a-Edicao.xlsx"
        },
        "Failed to read Excel file"
      );
      throw new Error(`Failed to read Excel file at ${filePath}: ${fileError}`);
    }
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const data = XLSX.utils.sheet_to_json(firstSheet, {
      header: 2,
      defval: null,
      range: 2,
    }) as any[];
    
    logger.info({ totalRows: data.length }, "Excel file read successfully");
    
    const documents: TacoItemDocument[] = [];
    let currentGrupo = "";
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      if (!row || !row["Alimento"]) {
        continue;
      }
      
      const alimentoNum = row["Alimento"];
      const descricao = parseString(row["Descrição dos alimentos"]);
      
      if (typeof alimentoNum === "string" && descricao === undefined) {
        currentGrupo = alimentoNum;
        continue;
      }
      
      if (descricao === undefined || descricao.length === 0) {
        continue;
      }
      
      const codigo = String(alimentoNum);
      const id = generateUUID();
      
      const doc: TacoItemDocument = {
        _id: id,
        codigo,
        nome: descricao,
        nomeCientifico: undefined,
        grupo: currentGrupo || "Não especificado",
        marca: undefined,
        energiaKcal: parseNumber(row["(kcal)"]),
        energiaKj: parseNumber(row["(kJ)"]),
        umidade: parseNumber(row["(%)"]),
        proteinaG: parseNumber(row["(g)"]),
        lipidioG: parseNumber(row["(g)_1"]),
        colesterolMg: parseNumber(row["(mg)"]),
        carboidratoG: parseNumber(row["(g)_2"]),
        fibraAlimentarG: parseNumber(row["(g)_3"]),
        cinzasG: parseNumber(row["(g)_4"]),
        calcioMg: parseNumber(row["(mg)_1"]),
        magnesioMg: parseNumber(row["(mg)_2"]),
        manganesMg: parseNumber(row["(mg)_3"]),
        fosforoMg: parseNumber(row["(mg)_4"]),
        ferroMg: parseNumber(row["(mg)_5"]),
        sodioMg: parseNumber(row["(mg)_6"]),
        potassioMg: parseNumber(row["(mg)_7"]),
        cobreMg: parseNumber(row["(mg)_8"]),
        zincoMg: parseNumber(row["(mg)_9"]),
        retinolMcg: parseNumber(row["(mcg)"]),
        reMcg: parseNumber(row["(mcg)_1"]),
        raeMcg: parseNumber(row["(mcg)_2"]),
        tiaminaMg: parseNumber(row["(mg)_10"]),
        riboflavinaMg: parseNumber(row["(mg)_11"]),
        piridoxinaMg: parseNumber(row["(mg)_12"]),
        niacinaMg: parseNumber(row["(mg)_13"]),
        vitaminaCMg: parseNumber(row["(mg)_14"]),
        porcaoPadraoG: 100,
        unidade: "g",
        createdAt: new Date(),
        updatedAt: new Date(),
        searchableText: createSearchableText(descricao, currentGrupo),
      };
      
      documents.push(doc);
      
      if (documents.length % 100 === 0) {
        logger.info({ imported: documents.length }, "Progress...");
      }
    }
    
    logger.info({ totalDocuments: documents.length }, "Inserting documents into MongoDB...");
    
    if (documents.length > 0) {
      await collection.insertMany(documents);
      
      logger.info("Creating indexes...");
      await collection.createIndex({ nome: "text", searchableText: "text" });
      await collection.createIndex({ codigo: 1 });
      await collection.createIndex({ grupo: 1 });
      
      logger.info(
        {
          totalImported: documents.length,
          collection: DATABASE.COLLECTIONS.TACO_ITEMS,
        },
        "TACO data imported successfully"
      );
    } else {
      logger.warn("No documents to import");
    }
  } catch (error) {
    logger.error({ error }, "Failed to import TACO data");
    throw error;
  } finally {
    await connection.disconnect();
    logger.info("Disconnected from MongoDB");
  }
}

importTacoData()
  .then(() => {
    logger.info("Import completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "Import failed");
    process.exit(1);
  });
