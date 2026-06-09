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
const appDataSheet = workbook.SheetNames.find(name => name.toLowerCase() === 'appdata');
const sheetName = sheetNameArg || appDataSheet || workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.error(`Sheet not found: ${sheetName}`);
  console.error(`Available sheets: ${workbook.SheetNames.join(', ')}`);
  process.exit(1);
}

const rawRows = xlsx.utils.sheet_to_json(worksheet, {
  header: 1,
  defval: '',
  raw: true,
  blankrows: false
});

if (!rawRows.length) {
  console.error(`No data rows found in sheet: ${sheetName}`);
  process.exit(1);
}

const fieldNames = [
  'period',
  'date',
  'month',
  'month_end',
  'invoice_date',
  'channel',
  'area',
  'region',
  'sales_area',
  'salesmanname',
  'salesman_name',
  'customer',
  'customer_name',
  'client',
  'product',
  'product_name',
  'item',
  'item_description',
  'qty',
  'quantity',
  'bottles',
  'units',
  'amount',
  'revenue',
  'sales',
  'value',
  'net_sales'
];

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

function rowToObject(headers, row) {
  const out = {};
  headers.forEach((header, index) => {
    if (header) out[header] = row[index];
  });
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

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (parsed) {
      return [
        String(parsed.d).padStart(2, '0'),
        String(parsed.m).padStart(2, '0'),
        parsed.y
      ].join('/');
    }
  }

  const text = String(value || '').trim();
  const dateOnly = text.split(/\s+/)[0];
  const match = dateOnly.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!match) throw new Error(`Invalid date on row ${line}: ${text}`);

  const first = Number(match[1]);
  const second = Number(match[2]);
  const isUsDate = second > 12 && first <= 12;
  const day = String(isUsDate ? second : first).padStart(2, '0');
  const month = String(isUsDate ? first : second).padStart(2, '0');
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${day}/${month}/${year}`;
}

function parseNumber(value, label, line) {
  const text = String(value ?? '').replace(/[R,\s]/g, '');
  const num = Number(text);
  if (!Number.isFinite(num)) throw new Error(`Invalid ${label} on row ${line}: ${value}`);
  return num;
}

const normalizedHeaders = rawRows[0].map(normalizeHeader);
const hasHeader = normalizedHeaders.some(header => fieldNames.includes(header));
const sourceRows = hasHeader
  ? rawRows.slice(1).map((row, index) => ({ line: index + 2, row: normalizeRow(rowToObject(normalizedHeaders, row)) }))
  : rawRows.map((row, index) => ({
      line: index + 1,
      row: normalizeRow({
        period: row[0],
        channel: row[1],
        customer: row[2],
        product: row[3],
        qty: row[4],
        amount: row[5]
      })
    }));

const salesRows = sourceRows.map(({ row, line }) => {

  const period = parseDate(pick(row, ['period', 'date', 'month', 'month_end', 'invoice_date']), line);
  let channel = String(pick(row, ['channel', 'area', 'region', 'sales_area', 'salesmanname', 'salesman_name'])).trim();
  const customer = String(pick(row, ['customer', 'customer_name', 'client'])).trim();
  const product = String(pick(row, ['product', 'product_name', 'item', 'item_description'])).trim();
  const qty = parseNumber(pick(row, ['qty', 'quantity', 'bottles', 'units']), 'quantity', line);
  const amount = parseNumber(pick(row, ['amount', 'revenue', 'sales', 'value', 'net_sales']), 'amount', line);

  if (qty === 0 && amount === 0) return null;
  if (!channel) channel = 'Unassigned';
  if (!customer) throw new Error(`Missing customer on row ${line}`);
  if (!product) throw new Error(`Missing product on row ${line}`);

  return [period, channel, customer, product, qty, amount];
}).filter(Boolean);

const outPath = path.join(__dirname, '..', 'private', 'sales-data.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(salesRows, null, 2));

console.log(`Imported ${salesRows.length} rows from "${sheetName}" into private/sales-data.json`);
