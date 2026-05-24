const { clearCookie, json } = require('./lib/session');

exports.handler = async function(){
  return json(200, { ok:true }, { 'Set-Cookie':clearCookie() });
};
