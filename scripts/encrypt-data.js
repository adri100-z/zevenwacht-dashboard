const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const keyRaw = process.env.DATA_ENCRYPTION_KEY;
if(!keyRaw) throw new Error('Set DATA_ENCRYPTION_KEY before running this script');
const key = Buffer.from(keyRaw, 'base64');
if(key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must decode to 32 bytes');

function encryptFile(source, dest){
  const value = JSON.parse(fs.readFileSync(source, 'utf8'));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(value))), cipher.final()]);
  const payload = { alg:'AES-256-GCM', iv:iv.toString('base64'), tag:cipher.getAuthTag().toString('base64'), ciphertext:ciphertext.toString('base64') };
  fs.writeFileSync(dest, JSON.stringify(payload, null, 2));
}

fs.mkdirSync(path.join(root, 'data'), { recursive:true });
encryptFile(path.join(root, 'private', 'users.json'), path.join(root, 'data', 'users.enc.json'));
encryptFile(path.join(root, 'private', 'sales-data.json'), path.join(root, 'data', 'sales-data.enc.json'));
console.log('Encrypted data files written to data/');
