import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Timezone padrão do sistema (Brasil - São Paulo)
 */
const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Obtém a data atual no timezone do Brasil
 */
export function getToday(): dayjs.Dayjs {
  return dayjs().tz(DEFAULT_TIMEZONE).startOf("day");
}

/**
 * Normaliza uma data para o início do dia no timezone do Brasil
 */
export function normalizeToStartOfDay(date: Date | dayjs.Dayjs | string): dayjs.Dayjs {
  return dayjs(date).tz(DEFAULT_TIMEZONE).startOf("day");
}

/**
 * Normaliza uma data para o final do dia no timezone do Brasil
 */
export function normalizeToEndOfDay(date: Date | dayjs.Dayjs | string): dayjs.Dayjs {
  return dayjs(date).tz(DEFAULT_TIMEZONE).endOf("day");
}

/**
 * Converte dayjs para Date (mantendo o timezone)
 */
export function toDate(date: dayjs.Dayjs): Date {
  return date.toDate();
}

/**
 * Obtém a chave de data no formato YYYY-MM-DD no timezone do Brasil
 */
export function getDateKey(date: Date | dayjs.Dayjs | string): string {
  return normalizeToStartOfDay(date).format("YYYY-MM-DD");
}

/**
 * Obtém o início da semana (domingo) no timezone do Brasil
 */
export function getWeekStart(date: Date | dayjs.Dayjs | string = new Date()): dayjs.Dayjs {
  const normalizedDate = dayjs(date).tz(DEFAULT_TIMEZONE);
  const dayOfWeek = normalizedDate.day();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return normalizedDate.add(diff, "day").startOf("day");
}

/**
 * Adiciona dias a uma data no timezone do Brasil
 */
export function addDays(date: Date | dayjs.Dayjs | string, days: number): dayjs.Dayjs {
  return dayjs(date).tz(DEFAULT_TIMEZONE).add(days, "day");
}

/**
 * Verifica se duas datas são do mesmo dia no timezone do Brasil
 */
export function isSameDay(
  date1: Date | dayjs.Dayjs | string,
  date2: Date | dayjs.Dayjs | string
): boolean {
  return normalizeToStartOfDay(date1).isSame(normalizeToStartOfDay(date2), "day");
}

/**
 * Formata uma data para exibição no formato brasileiro
 */
export function formatDate(date: Date | dayjs.Dayjs | string, format: string = "DD/MM/YYYY"): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format(format);
}
