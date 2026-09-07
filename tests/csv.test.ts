import { describe, expect, it } from "vitest";
import { toCsv, type CsvColumn } from "@/lib/csv";

type Row = { name: string; count: number | null };
const columns: CsvColumn<Row>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Count", value: (row) => row.count },
];

const body = (csv: string) => csv.replace(/^﻿/, "").trim().split("\r\n");

describe("toCsv", () => {
  it("starts with a UTF-8 BOM so Excel doesn't mangle non-ASCII", () => {
    // Without this, "1352A — Watermelon" arrives as mojibake.
    expect(toCsv([], columns).startsWith("﻿")).toBe(true);
  });

  it("writes a header row and CRLF line endings", () => {
    const csv = toCsv([{ name: "Two Sum", count: 3 }], columns);
    expect(body(csv)).toEqual(["Name,Count", "Two Sum,3"]);
  });

  it("renders null as an empty cell, not the text 'null'", () => {
    expect(body(toCsv([{ name: "x", count: null }], columns))[1]).toBe("x,");
  });

  it("quotes values containing a comma", () => {
    expect(body(toCsv([{ name: "dp, graphs", count: 1 }], columns))[1]).toBe(
      '"dp, graphs",1'
    );
  });

  it("doubles embedded quotes per RFC 4180", () => {
    expect(body(toCsv([{ name: 'say "hi"', count: 1 }], columns))[1]).toBe(
      '"say ""hi""",1'
    );
  });

  it("quotes values containing a newline", () => {
    const csv = toCsv([{ name: "line1\nline2", count: 1 }], columns);
    expect(csv).toContain('"line1\nline2",1');
  });
});

describe("toCsv — spreadsheet formula injection", () => {
  // Excel and Sheets execute a cell that begins with one of these. Problem
  // titles come from external APIs and user input, so they are untrusted.
  it.each([
    ["=", '=HYPERLINK("http://evil","click")'],
    ["+", "+1+1"],
    ["-", "-2+3"],
    ["@", "@SUM(A1:A9)"],
  ])("neutralises a cell starting with %s", (_prefix, payload) => {
    const cell = body(toCsv([{ name: payload, count: 1 }], columns))[1];
    // Prefixed with an apostrophe, which spreadsheets strip on display but
    // never evaluate. Quoting is expected too, since the payloads contain commas.
    expect(cell.startsWith("'") || cell.startsWith(`"'`)).toBe(true);
  });

  it("leaves ordinary text untouched", () => {
    expect(body(toCsv([{ name: "Two Sum", count: 1 }], columns))[1]).toBe(
      "Two Sum,1"
    );
  });

  it("does not mangle negative numbers", () => {
    // The guard applies to strings only; a numeric -5 is not an injection risk.
    const numeric: CsvColumn<{ n: number }>[] = [
      { header: "N", value: (row) => row.n },
    ];
    expect(body(toCsv([{ n: -5 }], numeric))[1]).toBe("-5");
  });
});
