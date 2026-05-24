# Zevenwacht Dashboard - Netlify Secure Copy

This folder is a secure Netlify-ready copy of the original single-file dashboard. The original file at `C:\Claude\Projects\Zevenwacht-dashboard\index.html` was not modified.

## Deploy shape

- Public app shell: `public/index.html`
- Netlify Functions: `netlify/functions/*`
- Encrypted deploy data: `data/*.enc.json`
- Local plaintext inputs: `private/*.json` (ignored by git)

## Required Netlify environment variables

Set these in Netlify before deploying:

```
DATA_ENCRYPTION_KEY=v29P94OrQtK6TsFwnTfMT3RtgW2rQ5KLMFnI1D8UGus=
SESSION_SECRET=FLGdaCgsj4bt3AQDONZTwQVkS7yrnoEy5hmH4w+cp1U=
```

Keep these values private. Do not put them in public files.

## Re-encrypt after changing data

PowerShell:

```powershell
$env:DATA_ENCRYPTION_KEY = '<your base64 key>'
npm run encrypt
```

## Replace sales data from Excel

The Excel workbook should have one row per sale and a header row. The importer accepts these column names:

- Date: `period`, `date`, `month`, or `invoice_date`
- Area: `channel`, `area`, `region`, or `sales_area`
- Customer: `customer`, `customer_name`, or `client`
- Product: `product`, `product_name`, `item`, or `item_description`
- Quantity: `qty`, `quantity`, `bottles`, or `units`
- Revenue: `amount`, `revenue`, `sales`, `value`, or `net_sales`

Import the first worksheet:

```powershell
npm.cmd run import-sales-excel -- C:\path\to\sales.xlsx
```

Import a named worksheet:

```powershell
npm.cmd run import-sales-excel -- C:\path\to\sales.xlsx "Sheet1"
```

Then re-encrypt and commit `data/sales-data.enc.json`.

## Add or change a user

Generate a PIN hash:

```powershell
npm run hash-pin -- 123456
```

Paste the generated hash into `private/users.json`, then run:

```powershell
$env:DATA_ENCRYPTION_KEY = '<your base64 key>'
npm run encrypt
```

## Local testing

Install Netlify CLI dependencies, then run:

```powershell
npm install
npm run dev
```
