export class TacoItem {
  private constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly nome: string,
    public readonly nomeCientifico: string | undefined,
    public readonly grupo: string,
    public readonly marca: string | undefined,
    public readonly energiaKcal: number,
    public readonly energiaKj: number,
    public readonly umidade: number,
    public readonly proteinaG: number,
    public readonly lipidioG: number,
    public readonly colesterolMg: number,
    public readonly carboidratoG: number,
    public readonly fibraAlimentarG: number,
    public readonly cinzasG: number,
    public readonly calcioMg: number,
    public readonly magnesioMg: number,
    public readonly manganesMg: number,
    public readonly fosforoMg: number,
    public readonly ferroMg: number,
    public readonly sodioMg: number,
    public readonly potassioMg: number,
    public readonly cobreMg: number,
    public readonly zincoMg: number,
    public readonly retinolMcg: number,
    public readonly reMcg: number,
    public readonly raeMcg: number,
    public readonly tiaminaMg: number,
    public readonly riboflavinaMg: number,
    public readonly piridoxinaMg: number,
    public readonly niacinaMg: number,
    public readonly vitaminaCMg: number,
    public readonly porcaoPadraoG: number,
    public readonly unidade: "g" | "ml"
  ) {
    this.validate();
  }

  static create(data: {
    id: string;
    codigo: string;
    nome: string;
    nomeCientifico?: string;
    grupo: string;
    marca?: string;
    energiaKcal: number;
    energiaKj: number;
    umidade: number;
    proteinaG: number;
    lipidioG: number;
    colesterolMg: number;
    carboidratoG: number;
    fibraAlimentarG: number;
    cinzasG: number;
    calcioMg: number;
    magnesioMg: number;
    manganesMg: number;
    fosforoMg: number;
    ferroMg: number;
    sodioMg: number;
    potassioMg: number;
    cobreMg: number;
    zincoMg: number;
    retinolMcg: number;
    reMcg: number;
    raeMcg: number;
    tiaminaMg: number;
    riboflavinaMg: number;
    piridoxinaMg: number;
    niacinaMg: number;
    vitaminaCMg: number;
    porcaoPadraoG: number;
    unidade: "g" | "ml";
  }): TacoItem {
    return new TacoItem(
      data.id,
      data.codigo,
      data.nome,
      data.nomeCientifico,
      data.grupo,
      data.marca,
      data.energiaKcal,
      data.energiaKj,
      data.umidade,
      data.proteinaG,
      data.lipidioG,
      data.colesterolMg,
      data.carboidratoG,
      data.fibraAlimentarG,
      data.cinzasG,
      data.calcioMg,
      data.magnesioMg,
      data.manganesMg,
      data.fosforoMg,
      data.ferroMg,
      data.sodioMg,
      data.potassioMg,
      data.cobreMg,
      data.zincoMg,
      data.retinolMcg,
      data.reMcg,
      data.raeMcg,
      data.tiaminaMg,
      data.riboflavinaMg,
      data.piridoxinaMg,
      data.niacinaMg,
      data.vitaminaCMg,
      data.porcaoPadraoG,
      data.unidade
    );
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("TACO item ID is required");
    }

    if (!this.nome || this.nome.trim().length === 0) {
      throw new Error("TACO item name is required");
    }

    if (this.porcaoPadraoG <= 0) {
      throw new Error("TACO item porcaoPadraoG must be greater than 0");
    }
  }

  calculateNutritionForWeight(weightGrams: number): {
    kcal: number;
    proteinaG: number;
    carboidratoG: number;
    lipidioG: number;
    fibraG: number;
  } {
    const ratio = weightGrams / this.porcaoPadraoG;

    return {
      kcal: Math.round(this.energiaKcal * ratio * 100) / 100,
      proteinaG: Math.round(this.proteinaG * ratio * 100) / 100,
      carboidratoG: Math.round(this.carboidratoG * ratio * 100) / 100,
      lipidioG: Math.round(this.lipidioG * ratio * 100) / 100,
      fibraG: Math.round(this.fibraAlimentarG * ratio * 100) / 100,
    };
  }
}
