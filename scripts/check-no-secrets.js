const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const failures = [];
if(/const\s+USERS\s*=/.test(html)) failures.push('USERS constant found in public/index.html');
if(/const\s+RAW\s*=/.test(html)) failures.push('RAW constant found in public/index.html');
if(/pin_hash/.test(html)) failures.push('pin_hash found in public/index.html');
if(/localStorage\.getItem\('zw_user'\)|localStorage\.setItem\('zw_user'/.test(html)) failures.push('zw_user localStorage auth found in public/index.html');
if(failures.length){ console.error(failures.join('\n')); process.exit(1); }
console.log('No embedded auth/data secrets found in public/index.html');
