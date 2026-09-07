import { describe, expect, it } from "vitest";
import { normalizePageArgs, toPage } from "@/lib/pagination";

describe("normalizePageArgs", () => {
  it("defaults to the first page", () => {
    expect(normalizePageArgs()).toEqual({
      page: 1,
      pageSize: 10,
      skip: 0,
      take: 10,
    });
  });

  it("computes skip from the page number", () => {
    expect(normalizePageArgs({ page: 3 })).toMatchObject({ page: 3, skip: 20 });
  });

  // Page numbers arrive from the client, so they are clamped rather than
  // trusted. A negative skip would throw at the database.
  it.each([0, -5, -1])("clamps page %i up to 1", (page) => {
    expect(normalizePageArgs({ page })).toMatchObject({ page: 1, skip: 0 });
  });

  it("truncates a fractional page instead of producing a fractional skip", () => {
    expect(normalizePageArgs({ page: 2.7 })).toMatchObject({ page: 2, skip: 10 });
  });

  it("caps pageSize so one request cannot ask for the whole table", () => {
    expect(normalizePageArgs({ pageSize: 999 }).pageSize).toBe(50);
  });

  it("floors pageSize at 1 so take is never zero", () => {
    expect(normalizePageArgs({ pageSize: 0 }).pageSize).toBe(1);
  });
});

describe("toPage", () => {
  it("reports at least one page for an empty list", () => {
    // pageCount 0 would render "Page 1 of 0".
    expect(toPage([], 0, 1, 10).pageCount).toBe(1);
  });

  it("rounds the page count up over a partial last page", () => {
    expect(toPage([], 25, 2, 10).pageCount).toBe(3);
  });
});
