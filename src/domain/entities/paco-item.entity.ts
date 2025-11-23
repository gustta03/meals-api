export class PacoItem {
  private constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly energiaKcal: number,
    public readonly proteinaG: number,
    public readonly carboidratoG: number,
    public readonly lipidioG: number,
    public readonly porcaoPadraoG: number,
    public readonly unidade: "g" | "ml",
    public readonly nomeAlternativo?: string[]
  ) {
    this.validate();
  }

  static create(
    id: string,
    nome: string,
    energiaKcal: number,
    proteinaG: number,
    carboidratoG: number,
    lipidioG: number,
    porcaoPadraoG: number,
    unidade: "g" | "ml" = "g",
    nomeAlternativo?: string[]
  ): PacoItem {
    return new PacoItem(
      id,
      nome,
      energiaKcal,
      proteinaG,
      carboidratoG,
      lipidioG,
      porcaoPadraoG,
      unidade,
      nomeAlternativo
    );
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("PacoItem ID is required");
    }

    if (!this.nome || this.nome.trim().length === 0) {
      throw new Error("PacoItem nome is required");
    }

    if (this.energiaKcal < 0) {
      throw new Error("Energia cannot be negative");
    }

    if (this.proteinaG < 0) {
      throw new Error("Proteína cannot be negative");
    }

    if (this.carboidratoG < 0) {
      throw new Error("Carboidrato cannot be negative");
    }

    if (this.lipidioG < 0) {
      throw new Error("Lipídio cannot be negative");
    }

    if (this.porcaoPadraoG <= 0) {
      throw new Error("Porção padrão must be greater than zero");
    }
  }

  calculateNutritionForWeight(weightGrams: number): {
    kcal: number;
    proteinaG: number;
    carboidratoG: number;
    lipidioG: number;
  } {
    const ratio = weightGrams / this.porcaoPadraoG;

    return {
      kcal: Math.round(this.energiaKcal * ratio * 100) / 100,
      proteinaG: Math.round(this.proteinaG * ratio * 100) / 100,
      carboidratoG: Math.round(this.carboidratoG * ratio * 100) / 100,
      lipidioG: Math.round(this.lipidioG * ratio * 100) / 100,
    };
  }

  matchesSearchTerm(searchTerm: string): boolean {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedNome = this.nome.toLowerCase();

    if (normalizedNome.includes(normalizedSearch) || normalizedSearch.includes(normalizedNome)) {
      return true;
    }

    if (this.nomeAlternativo) {
      return this.nomeAlternativo.some(
        (alt) =>
          alt.toLowerCase().includes(normalizedSearch) ||
          normalizedSearch.includes(alt.toLowerCase())
      );
    }

    return false;
  }
}

