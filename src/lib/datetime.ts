export const CLINIC_TIME_ZONE = "America/Sao_Paulo";

const TWO_DIGIT = "2-digit";

type DateInput = Date | string;
type ZonedDateParts = {
  day: string;
  hour: string;
  minute: string;
  month: string;
  second: string;
  year: string;
};

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

function getOffsetFormatter(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: TWO_DIGIT,
      minute: TWO_DIGIT,
      timeZone,
      timeZoneName: "longOffset",
    });
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: TWO_DIGIT,
      minute: TWO_DIGIT,
      timeZone,
      timeZoneName: "shortOffset",
    });
  }
}

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const timeZoneName =
    getOffsetFormatter(timeZone)
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";

  if (timeZoneName === "GMT") {
    return 0;
  }

  const match = timeZoneName.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);

  if (!match) {
    throw new Error(`Nao foi possivel interpretar o offset "${timeZoneName}".`);
  }

  const [, sign, hours, minutes = "00"] = match;
  const totalMinutes = Number(hours) * 60 + Number(minutes);
  const direction = sign === "+" ? 1 : -1;

  return direction * totalMinutes * 60 * 1000;
}

function getZonedDateParts(value: DateInput, timeZone = CLINIC_TIME_ZONE): ZonedDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: TWO_DIGIT,
    hour: TWO_DIGIT,
    hourCycle: "h23",
    minute: TWO_DIGIT,
    month: TWO_DIGIT,
    second: TWO_DIGIT,
    timeZone,
    year: "numeric",
  }).formatToParts(toDate(value));

  const readPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    day: readPart("day"),
    hour: readPart("hour"),
    minute: readPart("minute"),
    month: readPart("month"),
    second: readPart("second"),
    year: readPart("year"),
  };
}

function parseLocalDateTimeValue(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "00", millisecond = "0"] = match;

  return {
    day: Number(day),
    hour: Number(hour),
    millisecond: Number(millisecond.padEnd(3, "0")),
    minute: Number(minute),
    month: Number(month),
    second: Number(second),
    year: Number(year),
  };
}

function parseDateValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return {
    day: Number(day),
    month: Number(month),
    year: Number(year),
  };
}

function shiftDateValue(value: string, amount: number) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    throw new Error(`Data invalida: ${value}`);
  }

  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + amount));

  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function formatClinicCalendarDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  const parsed = parseDateValue(value);

  if (!parsed) {
    return value;
  }

  return `${String(parsed.day).padStart(2, "0")}/${String(parsed.month).padStart(2, "0")}/${parsed.year}`;
}

export function formatClinicDateTime(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(value));
}

export function formatClinicTimeRange(value: string, durationMinutes: number | null) {
  const start = new Date(value);
  const end = new Date(start.getTime() + (durationMinutes ?? 30) * 60 * 1000);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      hour: TWO_DIGIT,
      hour12: false,
      minute: TWO_DIGIT,
      timeZone: CLINIC_TIME_ZONE,
    }).format(date);

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function toClinicDateInputValue(value: DateInput) {
  const parts = getZonedDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toClinicDateTimeLocalValue(value: DateInput) {
  const parts = getZonedDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function getClinicNowDateValue() {
  return toClinicDateInputValue(new Date());
}

export function getClinicNextHourDateTimeLocalValue() {
  return toClinicDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000));
}

export function fromClinicDateTimeLocalValue(value: string) {
  if (!value) {
    return null;
  }

  const parsed = parseLocalDateTimeValue(value);

  if (!parsed) {
    throw new Error(`Data e hora invalidas: ${value}`);
  }

  const baseUtc = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second,
    parsed.millisecond,
  );

  const firstGuess = new Date(baseUtc);
  const firstOffset = getTimeZoneOffsetMilliseconds(firstGuess, CLINIC_TIME_ZONE);
  let resolvedUtc = baseUtc - firstOffset;
  const secondOffset = getTimeZoneOffsetMilliseconds(new Date(resolvedUtc), CLINIC_TIME_ZONE);

  if (secondOffset !== firstOffset) {
    resolvedUtc = baseUtc - secondOffset;
  }

  return new Date(resolvedUtc).toISOString();
}

export function getClinicDayBounds(value: string) {
  const startIso = fromClinicDateTimeLocalValue(`${value}T00:00`);
  const nextDayIso = fromClinicDateTimeLocalValue(`${shiftDateValue(value, 1)}T00:00`);

  if (!startIso || !nextDayIso) {
    throw new Error(`Nao foi possivel calcular o intervalo do dia ${value}.`);
  }

  return {
    endExclusiveIso: nextDayIso,
    startIso,
  };
}
