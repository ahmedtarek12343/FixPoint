/**
 * CSV generation for spreadsheet export.
 *
 * Two things here are not obvious:
 *
 * 1. **Formula injection.** Excel and Sheets execute any cell whose text starts
 *    with `=`, `+`, `-`, `@`, tab or CR. Problem titles come from LeetCode,
 *    Codeforces and user input, so a title like `=HYPERLINK("evil","click")`
 *    would run when the file is opened. Such cells get a leading apostrophe,
 *    which spreadsheets strip on display but never execute.
 *
 * 2. **The BOM.** Without a UTF-8 byte-order mark Excel reads the file as the
 *    system codepage and mangles anything non-ASCII — including the em dash in
 *    our Codeforces titles.
 */

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/** Only applied to strings — a negative number is not an injection risk. */
function neutralizeFormula(value: string): string {
  return FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix))
    ? `'${value}`
    : value;
}

function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);

  const safe = neutralizeFormula(value);

  // Quote when the value contains a delimiter, a quote, or a newline; doubling
  // any embedded quotes per RFC 4180.
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((column) => escapeCell(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(",")
    ),
  ];

  // CRLF is what Excel expects; the BOM is what stops it mangling UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // A download of personal data should never sit in a shared cache.
      "Cache-Control": "no-store",
    },
  });
}
