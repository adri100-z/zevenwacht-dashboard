const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const inputPath = process.argv[2];
const sheetNameArg = process.argv[3];

if (!inputPath) {
  console.error('Usage: npm.cmd run import-sales-excel -- path\\to\\sales.xlsx [SheetName]');
  process.exit(1);
}

const sourcePath = path.resolve(inputPath);
if (!fs.existsSync(sourcePath)) {
  console.error(`Excel file not found: ${sourcePath}`);
  process.exit(1);
}

const workbook = xlsx.readFile(sourcePath, { cellDates: true });
const sheetName = sheetNameArg || workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.error(`Sheet not found: ${sheetName}`);
  console.error(`Available sheets: ${workbook.SheetNames.join(', ')}`);
  process.exit(1);
}

const rows = xlsx.utils.sheet_to_json(worksheet, {
  defval: '',
  raw: false,
  blankrows: false
});

if (!rows.length) {
  console.error(`No data rows found in sheet: ${sheetName}`);
  process.exit(1);
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function pick(row, names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row, name)) return row[name];
  }
  return '';
}

function normalizeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[normalizeHeader(key)] = value;
  }
  return out;
}

function parseDate(value, line) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return [
      String(value.getDate()).padStart(2, '0'),
      String(value.getMonth() + 1).padStart(2, '0'),
      value.getFullYear()
    ].join('/');
  }

  const text = String(value || '').trim();
  const dateOnly = text.split(/\s+/)[0];
  const match = dateOnly.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) throw new Error(`Invalid date on row ${line}: ${text}`);

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${day}/${month}/${year}`;
}

function parseNumber(value, label, line) {
  const text = String(value || '').replace(/[R,\s]/g, '');
  const num = Number(text);
  if (!Number.isFinite(num)) throw new Error(`Invalid ${label} on row ${line}: ${value}`);
  return num;
}

const salesRows = rows.map((sourceRow, index) => {
  const line = index + 2;
  const row = normalizeRow(sourceRow);

  const period = parseDate(pick(row, ['period', 'date', 'month', 'invoice_date']), line);
  const channel = String(pick(row, ['channel', 'area', 'region', 'sales_area'])).trim();
  const customer = String(pick(row, ['customer', 'customer_name', 'client'])).trim();
  const product = String(pick(row, ['product', 'product_name', 'item', 'item_description'])).trim();
  const qty = parseNumber(pick(row, ['qty', 'quantity', 'bottles', 'units']), 'quantity', line);
  const amount = parseNumber(pick(row, ['amount', 'revenue', 'sales', 'value', 'net_sales']), 'amount', line);

  if (!channel) throw new Error(`Missing channel/area on row ${line}`);
  if (!customer) throw new Error(`Missing customer on row ${line}`);
  if (!product) throw new Error(`Missing product on row ${line}`);

  return [period, channel, customer, product, qty, amount];
});

const outPath = path.join(__dirname, '..', 'private', 'sales-data.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(salesRows, null, 2));

console.log(`Imported ${salesRows.length} rows from "${sheetName}" into private/sales-data.json`);
