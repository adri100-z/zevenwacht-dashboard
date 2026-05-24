const crypto = require('crypto');
const { decryptFile } = require('./crypto-store');

function hashPin(pin){
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function safeUser(user){
  return { name:user.name, role:user.role, channels:user.channels || [] };
}

function loadUsers(){
  return decryptFile('users.enc.json');
}

function findUserBySession(session){
  if(!session) return null;
  return loadUsers().find(u => u.name === session.name && u.role === session.role);
}

module.exports = { hashPin, safeUser, loadUsers, findUserBySession };
