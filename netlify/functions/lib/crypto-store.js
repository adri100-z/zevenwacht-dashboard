const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');

function getDataKey(){
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if(!raw) throw new Error('DATA_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(raw, 'base64');
  if(key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must decode to 32 bytes');
  return key;
}

function decryptFile(name){
  const payload = JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', getDataKey(), Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final()
  ]);
  return JSON.parse(plaintext.toString('utf8'));
}

module.exports = { decryptFile };
