import { logger } from "@shared/logger/logger";
import { CONFIG } from "@shared/constants/config.constants";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface TacoNutrient {
  kcal: number | null;
  protein: number | null;
  lipids: number | null;
  carbohydrates: number | null;
}

interface TacoFood {
  id: number;
  name: string;
  nutrients: TacoNutrient;
}

interface TacoFoodsResponse {
  getAllFood: TacoFood[];
}

interface TacoFoodResponse {
  getFoodById: TacoFood | null;
}

interface TacoFoodByNameResponse {
  getFoodByName: TacoFood[];
}

/**
 * Cliente GraphQL para consumir a API TACO
 * 
 * NOTA: As queries GraphQL abaixo são baseadas no schema real da API TACO.
 * Para verificar o schema, acesse:
 * http://localhost:4000/graphql (quando a API estiver rodando localmente)
 * 
 * A API TACO está disponível em: https://github.com/raulfdm/taco-api
 */
export class TacoGraphQLClient {
  private readonly endpoint: string;

  constructor(endpoint?: string) {
    this.endpoint = endpoint || CONFIG.TACO.API_URL;
  }

  async findByName(name: string): Promise<TacoFood | null> {
    try {
      const query = `
        query FindFoodByName($name: String!) {
          getFoodByName(name: $name) {
            id
            name
            nutrients {
              kcal
              protein
              lipids
              carbohydrates
            }
          }
        }
      `;

      const response = await this.executeQuery<TacoFoodByNameResponse>(query, { name });
      
      if (response.errors) {
        logger.warn({ errors: response.errors, name }, "GraphQL errors when finding food by name");
        return null;
      }

      const foods = response.data?.getFoodByName || [];
      return foods.length > 0 ? foods[0] : null;
    } catch (error) {
      logger.error({ error, name }, "Failed to find food by name in TACO API");
      return null;
    }
  }

  async search(searchTerm: string, limit: number = 10): Promise<TacoFood[]> {
    try {
      // Usa getFoodByName para busca, que retorna array
      const query = `
        query SearchFoods($name: String!) {
          getFoodByName(name: $name) {
            id
            name
            nutrients {
              kcal
              protein
              lipids
              carbohydrates
            }
          }
        }
      `;

      const response = await this.executeQuery<TacoFoodByNameResponse>(query, { 
        name: searchTerm
      });
      
      if (response.errors) {
        logger.warn({ errors: response.errors, searchTerm }, "GraphQL errors when searching foods");
        return [];
      }

      const foods = response.data?.getFoodByName || [];
      return foods.slice(0, limit);
    } catch (error) {
      logger.error({ error, searchTerm }, "Failed to search foods in TACO API");
      return [];
    }
  }

  async findAll(limit: number = 100): Promise<TacoFood[]> {
    try {
      const query = `
        query GetAllFoods {
          getAllFood {
            id
            name
            nutrients {
              kcal
              protein
              lipids
              carbohydrates
            }
          }
        }
      `;

      const response = await this.executeQuery<TacoFoodsResponse>(query);
      
      if (response.errors) {
        logger.warn({ errors: response.errors }, "GraphQL errors when getting all foods");
        return [];
      }

      const foods = response.data?.getAllFood || [];
      return foods.slice(0, limit);
    } catch (error) {
      logger.error({ error }, "Failed to get all foods from TACO API");
      return [];
    }
  }

  async findById(id: string): Promise<TacoFood | null> {
    try {
      const idInt = parseInt(id, 10);
      if (isNaN(idInt)) {
        logger.warn({ id }, "Invalid ID format, expected integer");
        return null;
      }

      const query = `
        query FindFoodById($id: Int!) {
          getFoodById(id: $id) {
            id
            name
            nutrients {
              kcal
              protein
              lipids
              carbohydrates
            }
          }
        }
      `;

      const response = await this.executeQuery<TacoFoodResponse>(query, { id: idInt });
      
      if (response.errors) {
        logger.warn({ errors: response.errors, id }, "GraphQL errors when finding food by id");
        return null;
      }

      return response.data?.getFoodById || null;
    } catch (error) {
      logger.error({ error, id }, "Failed to find food by id in TACO API");
      return null;
    }
  }

  private async executeQuery<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<GraphQLResponse<T>> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as GraphQLResponse<T>;
      return result;
    } catch (error) {
      logger.error({ error, endpoint: this.endpoint }, "Failed to execute GraphQL query");
      throw error;
    }
  }
}




