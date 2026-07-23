/**
 * Tiny, dependency-free CSV helper.
 *
 * We deliberately avoid pulling in a library — the data we export is simple
 * (flat rows of strings/numbers) and the RFC-4180 escaping rules are short.
 *
 * Bengali content: Excel on Windows guesses the encoding of a bare .csv as
 * the local ANSI code page, which mangles UTF-8 Bengali into gibberish.
 * Prepending a UTF-8 BOM (\uFEFF) forces Excel to read it as UTF-8. See
 * `toCsvWithBom` below.
 */

export type CsvValue = string | number | boolean | null | undefined;
export type CsvRow = CsvValue[];

/**
 * Escape a single field per RFC 4180: wrap in double quotes when the value
 * contains a comma, quote, CR or LF, and double up any embedded quotes.
 */
export function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Turn a header row + data rows into a CSV string (CRLF line endings, the
 * RFC-4180 default that Excel is happiest with).
 */
export function toCsv(headers: string[], rows: CsvRow[]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvField).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Same as `toCsv` but prefixed with a UTF-8 BOM so spreadsheet apps open
 * Bengali (and any non-ASCII) text correctly.
 */
export function toCsvWithBom(headers: string[], rows: CsvRow[]): string {
  return "\uFEFF" + toCsv(headers, rows);
}
