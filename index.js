// The MIT License
// Copyright 2012-2016 (c) Peter Širka <petersirka@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Url = require('url');
var http = require('http');
var https = require('https');
var Qs = require('querystring');
var crypto = require('crypto');

function Payment(amount, vs, cs, note, currency) {
	this.builder = ['func' + 'tion _libraryPlatba(f,n,v){var i=document.createElement("INPUT");i.setAttribute("type","hidden");i.setAttribute("name",n);i.setAttribute("value",v);f.appendChild(i);return i;}'];
	this.amount = amount || 0;
	this.currency = currency || 'EUR';
	this.VS = vs || '';
	this.CS = cs || '';
	this.SS = '';
	this.email = '';
	this.phone = '';
	this.note = note || '';
}

/**
 * Tatra banka (tatrapay)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.tatrapay2 = function(mid, key, url) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var currency = '978';

	switch (self.currency.toUpperCase()) {
		case 'EUR':
			currency = '978';
			break;
	}

	var sign = desSign(mid + amount + currency + self.VS + self.SS + self.CS + url, key);
	var data = {
		PT: 'TatraPay',
		CS: self.CS,
		VS: self.VS,
		MID: mid,
		DESC: self.note.substring(0, 30),
		AMT: amount,
		LANG: 'SK',
		CURR: currency,
		SIGN: sign,
		RURL: url
	};

	if (self.SS)
		data.SS = self.SS;

	if (self.email)
		data.REM = self.email;

	if (self.phone)
		data.RSMS = self.phone;

	self.builder.push(createForm('onlineplatby_tatrapay', data, 'https://moja.tatrabanka.sk/cgi-bin/e-commerce/start/e-commerce.jsp'));
	return self;
};

/**
 * Tatra banka (tatrapay)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.tatrapay = function(mid, key, url) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var currency = '978';

	switch (self.currency.toUpperCase()) {
		case 'EUR':
			currency = '978';
			break;
	}

	var dt = new Date();
	var data = {
		PT: 'TatraPay',
		CS: self.CS,
		VS: self.VS,
		MID: mid,
		DESC: self.note.substring(0, 30),
		AMT: amount,
		LANG: 'sk',
		CURR: currency,
		AREDIR: '1',
		TIMESTAMP: dt.getDate().toString().padLeft(2, '0') + (dt.getMonth() + 1).toString().padLeft(2, '0') + dt.getFullYear() + dt.getHours().toString().padLeft(2, '0') + dt.getMinutes().toString().padLeft(2, '0') + dt.getSeconds().toString().padLeft(2, '0'),
		RURL: url
	};

	data.HMAC = hmacSign256(data.MID + data.AMT + data.CURR + data.VS + data.CS + data.RURL + data.TIMESTAMP, key);

	if (self.SS)
		data.SS = self.SS;

	if (self.email)
		data.REM = self.email;

	self.builder.push(createForm('onlineplatby_tatrapay', data, 'https://moja.tatrabanka.sk/cgi-bin/e-commerce/start/tatrapay'));
	return self;
};

/**
 * Tatra banka (cardpay)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @param {String} username
 * @param {String} ip
 * @return {Payment}
 */
Payment.prototype.cardpay2 = function(mid, key, url, username, ip) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var currency = '978';

	switch (self.currency.toUpperCase()) {
		case 'EUR':
			currency = '978';
			break;
	}

	if (!username)
		username = 'anonymous';

	if (!ip)
		ip = '127.0.0.1';

	if (username.length > 30)
		username = username.substring(0, 30);

	var sign = desSign(mid + amount + currency + self.VS + self.CS + url + ip + username, key);

	var data = {
		PT: 'CardPay',
		CS: self.CS,
		VS: self.VS,
		MID: mid,
		IPC: ip,
		NAME: username,
		AMT: amount,
		LANG: 'SK',
		CURR: currency,
		SIGN: sign,
		RURL: url
	};

	if (self.email)
		data.REM = self.email;

	if (self.phone)
		data.RSMS = self.phone;

	self.builder.push(createForm('onlineplatby_cardpay', data, 'https://moja.tatrabanka.sk/cgi-bin/e-commerce/start/e-commerce.jsp'));
	return self;
};

/**
 * Tatra banka (cardpay)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.cardpay = function(mid, key, url, username, ip) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var currency = '978';

	switch (self.currency.toUpperCase()) {
		case 'EUR':
			currency = '978';
			break;
	}

	if (!username)
		username = 'anonymous';

	if (!ip)
		ip = '127.0.0.1';

	if (username.length > 30)
		username = username.substring(0, 30);

	var dt = new Date();
	var data = {
		AREDIR: '1',
		CS: self.CS,
		VS: self.VS,
		MID: mid,
		IPC: ip,
		NAME: username,
		AMT: amount,
		LANG: 'sk',
		CURR: currency,
		TIMESTAMP: dt.getDate().toString().padLeft(2, '0') + (dt.getMonth() + 1).toString().padLeft(2, '0') + dt.getFullYear().toString() + dt.getHours().toString().padLeft(2, '0') + dt.getMinutes().toString().padLeft(2, '0') + dt.getSeconds().toString().padLeft(2, '0'),
		RURL: url
	};

	data.HMAC = hmacSign256(data.MID + data.AMT + data.CURR + data.VS + data.RURL + data.IPC + data.NAME + data.TIMESTAMP, key);

	if (self.email)
		data.REM = self.email;

	self.builder.push(createForm('onlineplatby_cardpay', data, 'https://moja.tatrabanka.sk/cgi-bin/e-commerce/start/cardpay'));
	return self;
};

/**
 * Slovenská sporiteľňa (sporopay)
 * @param {String} key
 * @param {String} account In the form "0000000/1100" (or with prefix "000000-000000000/1100").
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.sporopay = function(key, account, url) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var currency = self.currency.toUpperCase();

	var bankBefore = '000000';
	var bankAccount = '';
	var bankCode = '';

	var SS = self.SS ? self.SS.padLeft(10, '0') : '0000000000';

	if (amount.indexOf('.') === -1)
		amount += '.00';

	var bank = account.split('/');
	if (bank[0].indexOf('-') !== -1) {
		var val = bank[0].split('-');
		bankBefore = val[0];
		bankAccount = val[1];
	} else
		bankAccount = bank[0];

	bankCode = bank[1];

	var data = {
		pu_predcislo: bankBefore,
		pu_cislo: bankAccount,
		pu_kbanky: bankCode,
		suma: amount,
		mena: currency,
		ss: SS,
		url: url,
		param: '',
		sign1: sporopaySign(bankBefore + ';' + bankAccount + ';' + bankCode + ';' + amount + ';' + currency + ';' + self.VS + ';' + SS + ';' + url + ';', key)
	};

	self.builder.push(createForm('onlineplatby_sporopay', data, 'https://ib.slsp.sk/epayment/epayment/epayment.xml'));
	return self;
};

/**
 * Volksbank (vebay)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.vebpay = function(mid, key, url) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var sign = desSign(mid + amount + self.VS + self.SS + self.CS + url, key);

	var data = {
		CS: self.CS,
		VS: self.VS,
		MID: mid,
		DESC: self.note ? self.note.substring(0, 30) : '',
		AMT: amount,
		SIGN: sign,
		RURL: url
	};

	if (self.SS)
		data.SS = self.SS;

	if (self.email)
		data.REM = self.email;

	if (self.phone)
		data.RSMS = self.phone;

	self.builder.push(createForm('onlineplatby_vebpay', data, 'https://ibs.luba.sk/vebpay/'));
	return self;
};

/**
 * UniCredit Bank (uniplatba)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.uniplatba = function(mid, key, url) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var note = self.note ? self.note.substring(0, 30) : '';
	var sign = desSign(mid + 'SK' + amount + self.VS + self.CS + self.SS + note, key);

	var data = {
		CS: self.CS,
		VS: self.VS,
		LANG: 'SK',
		MID: mid,
		DESC: note,
		AMT: amount,
		SIGN: sign,
		RURL: url
	};

	if (self.SS)
		data.SS = self.SS;

	self.builder.push(createForm('onlineplatby_uniplatba', data, 'https://sk.unicreditbanking.net/disp?restart=true&link=login.tplogin.system_login'));
	return self;
};

/**
 * VÚB banka (vubeplatby)
 * @param {String} mid
 * @param {String} key
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.vubeplatby = function(mid, key, url) {

	var self = this;
	var amount = prepareAmount(self.amount);
	var sign = vubeplatbySign(mid + amount + self.VS + self.CS + url, key);

	var data = {
		CS: self.CS,
		VS: self.VS,
		MID: mid,
		DESC: self.note ? self.note.substring(0, 30) : '',
		AMT: amount,
		SIGN: sign,
		RURL: url
	};

	if (self.SS)
		data.SS = self.SS;

	self.builder.push(createForm('onlineplatby_vubeplatby', data, 'https://ib.vub.sk/e-platbyeuro.aspx'));
	return self;
};

/**
 * ČSOB (platobné tlačítko)
 * @param {String} mid
 * @param {String} account In the form "0000000/1100".
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.platobnetlacitko = function(mid, account, url) {

	var self = this;
	var amount = prepareNumber(self.amount);
	var note = self.note ? self.note.substring(0, 30) : '';

	account = account.replace(/\s/g, '').split('/');
	var xml = '<zprava ofce="3111"><obchodnik><id>' + mid + '</id><urlObchodnika>' + url + '</urlObchodnika></obchodnik><data><nProtiucet>' + account[0] + '</nProtiucet><chKodBankaProti>' + account[1] + '</chKodBankaProti><nCastka>' + amount + '</nCastka><nKS>' + self.CS + '</nKS><chVS>' + self.VS +'</chVS>';

	if (self.SS)
		xml += '<nSS>' + self.SS + '</nSS>';

	xml += '<vchPoleAV1>#' + mid + '</vchPoleAV1>';

	if (note)
		xml += '<vchPoleAV2>' + note + '</vchPoleAV2>';

	xml += '</data></zprava>';

	self.builder.push(createForm('onlineplatby_platobnetlacitko', { ZPRAVA: xml }, 'https://ib24.csob.sk/Channels.aspx'));
	return self;
};

/**
 * Poštová banka (platbaonline)
 * @param {String} mid
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.platbaonline = function(mid, url) {
	var self = this;
	var data = {
		P8: mid,
		P7: self.VS,
		P9: self.SS ? self.SS : '0',
		URL: url,
		MID: mid,
		P1: prepareAmount(self.amount),
		P2: '0',
		P3: '0',
		P10: self.note
	};
	self.builder.push(createForm('onlineplatby_platbaoline', data, 'https://moja.postovabanka.sk/ib/gateposk.aspx', 'GET'));
	return self;
};

/**
 * OTP banka (otppay)
 * @param {String} mid
 * @param {String} url Redirect URL.
 * @return {Payment}
 */
Payment.prototype.otppay = function(mid, url) {

	var self = this;
	var data = {
		ESHOP: mid,
		VS: self.VS,
		CASTKA: prepareNumber(self.amount),
		URL: url
	};

	if (self.CS)
		data.CS = self.CS;

	if (self.SS)
		data.SS = self.SS;

	self.builder.push(createForm('onlineplatby_otppay', data, 'https://otpdirekt.otpbanka.sk/login/login_main_jelszoalapu.jsp'));
	return self;
};

/**
 * ASMS
 * @param {String} mid
 * @param {String} key
 * @param {String} url
 * @param {Function(err, { Code: String, Status: String, VS: String, JeChyba: Boolean })} callback
 * @return {Payment}
 */
Payment.prototype.asms = function(mid, key, url, callback) {

	var self = this;
	var amount = self.amount.toString().replace(',', '.').replace('.00', '');

	var index = amount.indexOf('.');
	if (index > 0) {
		if (amount.substring(index + 1).length === 1)
			amount += '0';
	}

	var sign = desSign(mid + amount + self.VS + url, key);
	var data = {
		CID: mid,
		VS: self.VS,
		AMT: amount,
		SIGN: sign,
		RURL: url
	};

	request('https://www.mypay.sk/payment/embed/?' + Qs.stringify(data), 'GET', '', function(err, data) {
		callback(err, err ? null : Qs.parse(data));
	});

	return self;
};

Payment.prototype.toString = function() {
	return this.builder.join('');
};

function Response(status, vs, ss, note) {
	this.status = status || '';
	this.VS = vs || '';
	this.SS = ss || '';
	this.note = note || '';
	this.paid = false;
}

// ======================================================
// HELPERS
// ======================================================

function desSign(value, key) {
	var sha1 = crypto.createHash('sha1');
	var buffer = new Buffer(sha1.update(value).digest('binary'), 'binary');

	value = buffer.slice(0, 8).toString('binary');
	key = new Buffer(key, 'ascii').toString('binary');

	var des = new crypto.createCipheriv('DES-ECB', key, '');
	var sign = des.update(value, 'binary', 'base64') + des.final('base64');

	return new Buffer(sign, 'base64').toString('hex').substring(0, 16).toUpperCase();
}

function hmacSign256(value, key) {
	return crypto.createHmac('SHA256', key.length === 128 ? new Buffer(key, 'hex') : new Buffer(key, 'ascii')).update(value).digest('hex');
}

function sporopaySign(value, key) {

	var sha1 = crypto.createHash('sha1');

	var buffer = new Buffer(sha1.update(value).digest('binary'), 'binary');
	var sign = new Buffer(24);
	var iv = new Buffer(8);

	for (var i = 0; i < buffer.length; i++)
		sign[i] = buffer[i];

	for (var i = 20; i < sign.length; i++)
		sign[i] = 255;

	iv.fill(0);

	//console.log(sign.toString('base64'));
	//console.log(iv.toString('base64'));
	//console.log(new Buffer(key, 'base64'));

	var des = new crypto.createCipheriv('des-ede-cbc', new Buffer(key, 'base64'), iv);
	var output = des.update(sign, 'binary', 'base64');

	return output;
};

function vubeplatbySign(value, key) {
	var sha256 = crypto.createHmac('sha256', key);
	return sha256.update(value).digest('hex').toUpperCase();
};

function createForm(name, obj, url, method) {
	var output = 'fun' + 'ction ' + name + '() {var f=document.createElement("FORM");f.setAttribute("action","' + url + '");f.setAttribute("method","' + ( method || 'POST') + '");f.setAttribute("name","' + name + '");';

	Object.keys(obj).forEach(function(key) {
		output += '_libraryPlatba(f,"' + key + '","' + obj[key] + '");';
	});

	output += 'document.body.appendChild(f);f.submit();';
	return output + '};';
};

function request(url, method, data, callback) {

	var uri = Url.parse(url);
	var headers = {};

	if (method !== 'GET')
		headers['Content-Type'] = 'application/x-www-form-urlencoded';

	var options = { protocol: uri.protocol, auth: uri.auth, method: method, hostname: uri.hostname, port: uri.port, path: uri.pathname, agent: false, headers: headers };

	var response = function(res) {
		var buffer = '';
		res.on('data', (chunk) => buffer += chunk.toString('utf8'));
		res.on('end', () => callback(null, buffer, res.statusCode, res.headers));
	};

	var con = options.protocol === 'https:' ? https : http;

	try
	{
		var req = callback ? con.request(options, response) : con.request(options);
		req.setTimeout(10000, () => callback(408, null));
		req.end((data || '').toString(), 'utf8');
	} catch (ex) {
		callback(ex, null);
	}
};

if (!String.prototype.padLeft) {
	String.prototype.padLeft = function(max, c) {
		var self = this;
		var len = max - self.length;
		if (len < 0)
			return self;
		if (c === undefined)
			c = '0';
		while (len--)
			self = c + self;
		return self;
	};
}


function prepareAmount(num, doubleZero) {

	var str = num.toString().replace(',', '.');
	var index = str.indexOf('.');

	if (index === -1) {
		if (doubleZero || true)
			str += '.00';
		return str;
	}

	var len = str.substring(index + 1).length;
	if (len === 1)
		str += '0';
	if (len > 2)
		str = str.substring(0, index + 3);
	return str;
}

// ======================================================
// EXPORTS
// ======================================================

exports.process = function(type, key, params, url) {

	var response;
	var sign;
	var tmp;

	switch (type) {
		case 'tatrapay':
			sign = hmacSign256((params.AMT || '') + (params.CURR || '') + (params.VS || '') + (params.CS || '') + (params.RES || '') + (params.TID || '') + (params.TIMESTAMP || ''), key);
			response = new Response(params.RES, params.VS);
			response.paid = params.HMAC === sign && params.RES === 'OK';
			return response;
		case 'cardpay':
			sign = hmacSign256((params.AMT || '') + (params.CURR || '') + (params.VS || '') + (params.RES || '') + (params.AC || '') + (params.TID || '') + (params.TIMESTAMP || ''), key);
			response = new Response(params.RES, params.VS);
			response.paid = params.HMAC === sign && params.RES === 'OK';
			return response;
		case 'tatrapay2':
			sign = desSign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
			response = new Response(params.RES, params.VS, params.SS);
			response.paid = params.SIGN === sign && params.RES === 'OK';
			return response;
		case 'cardpay2':
			sign = desSign((params.VS || '') + (params.RES || '') + (params.AC || ''), key);
			response = new Response(params.RES, params.VS);
			response.paid = params.SIGN === sign && params.RES === 'OK';
			return response;
		case 'vubeplatby':
			sign = vubeplatbySign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
			response = new Response(params.RES, params.VS);
			response.paid = params.SIGN === sign && params.RES === 'OK';
			return response;
		case 'uniplatba':
			sign = desSign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
			response = new Response(params.RES, params.VS);
			response.paid = params.SIGN === sign && params.RES === 'OK';
			return response;
		case 'vebpay':
			sign = desSign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
			response = new Response(params.RES, params.VS, params.SS);
			response.paid = params.SIGN === sign && params.RES === 'OK';
			return response;
		case 'sporopay':
			tmp = [];
			tmp.push(params.u_predcislo || '');
			tmp.push(params.u_cislo || '');
			tmp.push(params.u_kbanky || '');
			tmp.push(params.pu_predcislo || '');
			tmp.push(params.pu_cislo || '');
			tmp.push(params.pu_kbanky || '');
			tmp.push(params.suma || '');
			tmp.push(params.mena || '');
			tmp.push(params.vs || '');
			tmp.push(params.ss || '');
			tmp.push(url);
			tmp.push(params.result || '');
			tmp.push(params.real || '');
			sign = sporopaySign(signature.join(';'), key);
			response = new Response(params.result, params.vs, params.ss);
			response.paid = params.SIGN2 === sign && params.RES.toLowerCase() === 'ok';
			return response;
	}
};

exports.create = function(amount, vs, cs, note, currency) {
	return new Payment(amount, vs, cs, note, currency);
};