// Turning a table into text a spreadsheet opens: CSV to download, tab-separated
// to paste.

// A cell a spreadsheet would run as a formula starts with one of these; a
// quote in front keeps it text. Plain numbers, negative ones too, stay numbers.
const FORMULA_START = /^[=+\-@\t\r]/;
const NUMBER = /^-?\d+(\.\d+)?$/;

const asText = (text: string) =>
  FORMULA_START.test(text) && !NUMBER.test(text) ? `'${text}` : text;

const csvCell = (text: string) => {
  const safe = asText(text);
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

const tsvCell = (text: string) => asText(text).replace(/[\t\r\n]+/g, " ");

export const toCsv = (rows: string[][]) =>
  rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

export const toTsv = (rows: string[][]) =>
  rows.map((row) => row.map(tsvCell).join("\t")).join("\n");

// Saves CSV text as a file named after title, without the characters file
// systems refuse. The byte order mark makes Excel read it as UTF-8, so names
// and non-Latin scripts survive.
export const downloadCsv = (title: string, csv: string) => {
  const name = title
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name || "table"}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
