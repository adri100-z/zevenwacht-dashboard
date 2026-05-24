const { getSession, json } = require('./lib/session');
const { safeUser, findUserBySession } = require('./lib/auth');
const { decryptFile } = require('./lib/crypto-store');

function toTitle(s){ return s ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s; }

exports.handler = async function(event){
  const user = findUserBySession(getSession(event));
  if(!user) return json(401, { error:'Not authenticated' });
  let rows = decryptFile('sales-data.enc.json');
  const safe = safeUser(user);
  if(safe.role === 'rep' && safe.channels.length){
    const allowed = new Set(safe.channels.map(toTitle));
    rows = rows.filter(r => allowed.has(toTitle(r[1])));
  }
  return json(200, { rows });
};
