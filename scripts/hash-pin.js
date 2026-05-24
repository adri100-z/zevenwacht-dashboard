const crypto = require('crypto');

const pin = process.argv[2];

if (!pin) {
  console.error('Usage: npm run hash-pin -- 123456');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(String(pin)).digest('hex');
console.log(hash);
