import { describe, expect, it, vi } from "vitest";

import { downloadCsv, toCsv, toTsv } from "./tableExport";

describe("tableExport", () => {
  it("quotes CSV cells that need it and keeps formulas as text", () => {
    expect(
      toCsv([
        ["Map", "Note", "Homes"],
        ["Blk 1, A", 'Say "hi"', "12"],
        ["=SUM(A1)", "-5", "@x"]
      ])
    ).toBe(
      'Map,Note,Homes\r\n"Blk 1, A","Say ""hi""",12\r\n\'=SUM(A1),-5,\'@x'
    );
  });

  it("writes tab-separated rows that paste into a spreadsheet", () => {
    expect(
      toTsv([
        ["Map", "Note"],
        ["Blk 1", "line\tone\nline two"]
      ])
    ).toBe("Map\tNote\nBlk 1\tline one line two");
  });

  it("downloads a file named after the title, without characters file systems refuse", () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:x"),
      revokeObjectURL: vi.fn()
    });
    const names: string[] = [];
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        names.push(this.download);
      });

    downloadCsv("Counted visits: T01/T02", "a,b");
    downloadCsv("  ", "a,b");

    expect(names).toEqual(["Counted visits T01 T02.csv", "table.csv"]);
    click.mockRestore();
    vi.unstubAllGlobals();
  });
});
