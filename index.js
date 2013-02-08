// Copyright Peter Širka, Web Site Design s.r.o. (www.petersirka.sk)
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

var urlParser = require('url');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var crypto = require('crypto');
var util = require('util');

/*
	Vytvorenie spracovania platby
	@stav {String}
	@vs {String}
	@ss {String} :: optional
	@poznamka {String} :: optional
*/
function PlatbaSpracovanie(stav, vs, ss, poznamka) {
	this.stav = stav || '';
	this.VS = vs || '';
	this.SS = ss || '';
	this.poznamka = poznamka || '';
	this.jeZaplatena = false;
};

/*
	Vytvorenie požiadavky na platbu
	@cena {Number}
	@vs {String}
	@ks {String} :: optional
	@poznamka {String} :: optional
	@mena {String} :: optional (default EUR)
*/
function Platba(cena, vs, ks, poznamka, mena) {
	this.builder = [];
	this.cena = cena || 0;
	this.mena = mena || 'EUR';
	this.VS = vs || '';
	this.KS = ks || '';
	this.SS = '';
	this.notifikaciaEmail = '';
	this.notifikaciaMobil = '';
	this.poznamka = poznamka || '';
	this.builder.push('func' + 'tion _libraryPlatba(f,n,v){var i=document.createElement("INPUT");i.setAttribute("type","hidden");i.setAttribute("name",n);i.setAttribute("value",v);f.appendChild(i);return i;}');
};

// ======================================================
// FUNCTIONS
// ======================================================

/*
	Create signature
	@value {String}
	@key {String}
	return {String}
*/
function desSign(value, key) {
	var sha1 = crypto.createHash('sha1');
	var buffer = new Buffer(sha1.update(value).digest('binary'), 'binary');

	value = buffer.slice(0, 8).toString('binary');
	key = new Buffer(key, 'ascii').toString('binary');

	var des = new crypto.createCipheriv('DES-ECB', key, '');
	var sign = des.update(value, 'binary', 'base64') + des.final('base64');

	return new Buffer(sign, 'base64').toString('hex').substring(0, 16).toUpperCase();	
};

/*
	Create signature
	@value {String}
	@key {String}
	return {String}
*/
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

function createForm(name, obj, url) {

	var output = 'fun' + 'ction ' + name + '() {var f=document.createElement("FORM");f.setAttribute("action","' + url + '");f.setAttribute("method","POST");f.setAttribute("name","' + name + '");';

	Object.keys(obj).forEach(function(key) {
		output += '_libraryPlatba(f,"' + key + '","' + obj[key] + '");';
	});

	output += 'document.body.appendChild(f);f.submit();';
	return output + '};';
};


/*	
	Send request to URL
	@url {String}
	@method {String}
    @data {String}
    @callback {Function} :: function(error, data, statusCode, headers)
    @headers {Object} :: optional, default {}
    @encoding {String} :: optional, default utf8
    @timeout {Number} :: optional, default 10000
*/
function request(url, method, data, callback, headers, encoding, timeout) {

	var uri = urlParser.parse(url);
	var h = {};

	method = (method || '').toString().toUpperCase();

	if (method !== 'GET')
		h['Content-Type'] = 'application/x-www-form-urlencoded';
	
	util._extend(h, headers);

	var options = { protocol: uri.protocol, auth: uri.auth, method: method, hostname: uri.hostname, port: uri.port, path: uri.pathname, agent:false, headers: h };

	var response = function onResponse(res) {
		var buffer = '';

		res.on('data', function onData(chunk) {
			buffer += chunk.toString('utf8');
		})

		res.on('end', function onEnd() {
			callback(null, buffer, res.statusCode, res.headers);
		});
	};

	var con = options.protocol === 'https:' ? https : http;

	try
	{
		var req = callback ? con.request(options, response) : con.request(options);

		req.setTimeout(timeout || 10000, function() {
			callback(408, null, {});
		});

		req.end((data || '').toString(), encoding || 'utf8');
	} catch (ex) {
		callback(new Error(ex), null, 0, {});
	}
};

// ======================================================
// PROTOTYPES
// ======================================================

/*
	@mid {String}
	@key {String}
	@callback {Function} :: @callback(err, { Code: '', Status: '', VS: '', JeChyba: {Boolean} });
	return {Platba}
*/
Platba.prototype.asms = function(mid, key, url, callback) {

	var self = this;
	var cena = self.cena.toString().replace(',', '.').replace('.00', '');

	var index = cena.indexOf('.');
	if (index > 0) {
		if (cena.substring(index + 1).length === 1)
			cena += '0';
	}

	var sign = desSign(mid + cena + self.VS + url, key);

	var platba = {
		CID: mid,
		VS: self.VS,
		AMT: cena,
		SIGN: sign,
		RURL: url
	};

	request('https://www.mypay.sk/payment/embed/?' + querystring.stringify(platba), 'GET', '', function(err, data) {
		callback(err, err === null ? querystring.parse(data) : null);
	});
	return self;
};

/*
	@mid {String}
	@key {String}
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.tatrapay = function(mid, key, url) {

	var self = this;
	var cena = prepareNumber(self.cena);
	var mena = '978';

	switch (self.mena.toUpperCase()) {
		case 'EUR':
			mena = '978';
			break;
	}

	var sign = desSign(mid + cena + mena + self.VS + self.SS + self.KS + url, key);

	var platba = {
		PT: 'TatraPay',
		CS: self.KS,
		VS: self.VS,
		MID: mid,
		DESC: self.poznamka.substring(0, 30),
		AMT: cena,
		LANG: 'SK',
		CURR: mena,
		SIGN: sign,
		RURL: url
	};

	if (self.SS.length > 0)
		platba.SS = self.SS;

	if (self.notifikaciaEmail.length > 0)
		platba.REM = self.notifikaciaEmail;

	if (self.notifikaciaMobil.length > 0)
		platba.RSMS = self.notifikaciaMobil;

	self.builder.push(createForm('platbaTatrapay', platba, 'https://moja.tatrabanka.sk/cgi-bin/e-commerce/start/e-commerce.jsp'));
	return self;
};

/*
	@mid {String}
	@key {String}
	@url {String} :: return URL
	@userName {String}
	@ip {String} :: IP address
	return {Platba}
*/
Platba.prototype.cardpay = function(mid, key, url, userName, ip) {

	var self = this;
	var cena = prepareNumber(self.cena);
	var mena = '978';

	switch (self.mena.toUpperCase()) {
		case 'EUR':
			mena = '978';
			break;
	}

	userName = userName || 'anonymous';
	ip = ip || '127.0.0.1';

	if (userName.length > 30)
		userName = userName.substring(0, 30);

	var sign = desSign(mid + cena + mena + self.VS + self.KS + url + ip + userName, key);

	var platba = {
		PT: 'CardPay',
		CS: self.KS,
		VS: self.VS,
		MID: mid,
		IPC: ip,
		NAME: userName,
		AMT: cena,
		LANG: 'SK',
		CURR: mena,
		SIGN: sign,
		RURL: url
	};

	if (self.notifikaciaEmail.length > 0)
		platba.REM = self.notifikaciaEmail;

	if (self.notifikaciaMobil.length > 0)
		platba.RSMS = self.notifikaciaMobil;

	self.builder.push(createForm('platbaCardpay', platba, 'https://moja.tatrabanka.sk/cgi-bin/e-commerce/start/e-commerce.jsp'));
	return self;
};

/*
	@key {String}
	@ucet {String} :: v tvare 0000000/1100 (alebo s predčíslom 000000-000000000/1100)
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.sporopay = function(key, ucet, url) {

	var self = this;
	var cena = prepareNumber(self.cena);
	var mena = self.mena.toUpperCase();

	var bankaPred = '000000';
	var bankaUcet = '';
	var bankaKod = '';
	var SS = self.SS.length > 0 ? self.SS.padLeft(10, '0') : '0000000000';

	if (cena.indexOf('.') === -1)
		cena += '.00';

	var banka = ucet.split('/');

	if (banka[0].indexOf('-') !== -1) {
		var val = banka[0].split('-');
		bankaPred = val[0];
		bankaUcet = val[1];
	} else
		bankaUcet = banka[0];

	bankaKod = banka[1];

	var platba = {
		pu_predcislo: bankaPred,
		pu_cislo: bankaUcet,
		pu_kbanky: bankaKod,
		suma: cena,
		mena: mena,
		ss: SS,
		url: url,
		param: '',
		sign1: sporopaySign(bankaPred + ';' + bankaUcet + ';' + bankaKod + ';' + cena + ';' + mena + ';' + self.VS + ';' + SS + ';' + url + ';', key)	
	};

	self.builder.push(createForm('platbaSporopay', platba, 'https://ib.slsp.sk/epayment/epayment/epayment.xml'));
	return self;
};

/*
	@mid {String}
	@key {String}
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.vebpay = function(mid, key, url) {

	var self = this;
	var cena = prepareNumber(self.cena);

	var sign = desSign(mid + cena + self.VS + self.SS + self.KS + url, key);

	var platba = {
		CS: self.KS,
		VS: self.VS,
		MID: mid,
		DESC: self.poznamka.substring(0, 30),
		AMT: cena,
		SIGN: sign,
		RURL: url
	};

	if (self.SS.length > 0)
		platba.SS = self.SS;

	if (self.notifikaciaEmail.length > 0)
		platba.REM = self.notifikaciaEmail;

	if (self.notifikaciaMobil.length > 0)
		platba.RSMS = self.notifikaciaMobil;

	self.builder.push(createForm('platbaVebpay', platba, 'https://ibs.luba.sk/vebpay/'));
	return self;
};

/*
	@mid {String}
	@key {String}
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.uniplatba = function(mid, key, url) {

	var self = this;
	var cena = prepareNumber(self.cena);
	var poznamka = self.poznamka.substring(0, 30);

	var sign = desSign(mid + 'SK' + cena + self.VS + self.KS + self.SS + poznamka, key);

	var platba = {
		CS: self.KS,
		VS: self.VS,
		LANG: 'SK',
		MID: mid,
		DESC: poznamka,
		AMT: cena,
		SIGN: sign,
		RURL: url
	};

	if (self.SS.length > 0)
		platba.SS = self.SS;

	self.builder.push(createForm('platbaUniplatba', platba, 'https://sk.unicreditbanking.net/disp?restart=true&link=login.tplogin.system_login'));
	return self;
};

/*
	@mid {String}
	@key {String}
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.vubeplatby = function(mid, key, url) {

	var self = this;
	var cena = prepareNumber(self.cena);
	var sign = vubeplatbySign(mid + cena + self.VS + self.KS + url, key);

	var platba = {
		CS: self.KS,
		VS: self.VS,
		MID: mid,
		DESC: self.poznamka.substring(0, 30),
		AMT: cena,
		SIGN: sign,
		RURL: url
	};

	if (self.SS.length > 0)
		platba.SS = self.SS;

	self.builder.push(createForm('platbaVubeplatby', platba, 'https://ib.vub.sk/e-platbyeuro.aspx'));
	return self;
};

/*
	@mid {String},
	@ucet {String} :: v tvare 0000000/1100
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.platobnetlacitko = function(mid, ucet, url) {
	var self = this;
	var cena = prepareNumber(self.cena);
	var poznamka = self.poznamka.substring(0, 30);

	ucet = ucet.replace(/\s/g, '').split('/');	
	var xml = '<zprava ofce="3111"><obchodnik><id>' + mid + '</id><urlObchodnika>' + url + '</urlObchodnika></obchodnik><data><nProtiucet>' + ucet[0] + '</nProtiucet><chKodBankaProti>' + ucet[1] + '</chKodBankaProti><nCastka>' + cena + '</nCastka><nKS>' + self.KS + '</nKS><chVS>' + self.VS +'</chVS>';

	if (self.SS.length > 0)
		xml += '<nSS>' + self.SS + '</nSS>';

	xml += '<vchPoleAV1>#' + mid + '</vchPoleAV1>';

	if (poznamka.length > 0)
		xml += '<vchPoleAV2>' + poznamka + '</vchPoleAV2>';

	xml += '</data></zprava>';

	self.builder.push(createForm('platbaPlatobnetlacitko', { ZPRAVA: xml }, 'https://ib24.csob.sk/Channels.aspx'));
	return self;
};

/*
	@mid {String},
	@ucet {String} :: v tvare 0000000/1100
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.platbaonline = function(mid, url) {
	var self = this;
	var platba = {
		P8: mid,
		P7: self.VS,
		P9: self.SS.length > 0 ? platba.SS : '0',
		URL: url,
		MID: mid,
		P1: prepareNumber(self.cena),
		P2: '0',
		P3: '0',
		P10: self.poznamka
	};

	self.builder.push(createForm('platbaPlatbaonline', platba, 'https://ibpb.pabk.sk/inbank/gateposk.asp'));
	return self;
};

/*
	@mid {String},
	@url {String} :: return URL
	return {Platba}
*/
Platba.prototype.otppay = function(mid, url) {
	var self = this;
	var platba = {
		ESHOP: mid,
		VS: self.VS,
		CASTKA: prepareNumber(self.cena),
		UL: url
	};

	self.builder.push(createForm('platbaOtppay', platba, 'https://www.otpdirekt.sk/index_eshop1024.html'));
	return self;
};

Platba.prototype.toString = function() {
	return this.builder.join('');
};

String.prototype.padLeft = function padLeft(max, c) {
	var self = this.toString();
	return Array(Math.max(0, max - self.length + 1)).join(c || '0') + self;
};

// ======================================================
// EXPORTS
// ======================================================

/*
	@key {String}
	@params {Object} :: Request GET params
	return {PlatbaSpracovanie}
*/
exports.PlatbaSpracovanieTatrapay = function(key, params) {
	var platba = new PlatbaSpracovanie(params.RES, params.VS, params.SS);
	var sign = desSign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
	platba.jeZaplatena = params.SIGN === sign && params.RES === 'OK';
	return platba;
};

/*
	@key {String}
	@params {Object} :: Request GET params
	return {PlatbaSpracovanie}
*/
exports.PlatbaSpracovanieCardpay = function(key, params) {
	var platba = new PlatbaSpracovanie(params.RES, params.VS);
	var sign = desSign((params.VS || '') + (params.RES || '') + (params.AC || ''), key);
	platba.jeZaplatena = params.SIGN === sign && params.RES === 'OK';
	return platba;
};

/*
	@key {String}
	@params {Object} :: Request GET params
	return {PlatbaSpracovanie}
*/
exports.PlatbaSpracovanieVubeplatby = function(key, params) {
	var platba = new PlatbaSpracovanie(params.RES, params.VS);
	var sign = vubeplatbySign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
	platba.jeZaplatena = params.SIGN === sign && params.RES === 'OK';
	return platba;
};

/*
	@key {String}
	@params {Object} :: Request GET params
	return {PlatbaSpracovanie}
*/
exports.PlatbaSpracovanieUniplatba = function(key, params) {
	var platba = new PlatbaSpracovanie(params.RES, params.VS);
	var sign = desSign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
	platba.jeZaplatena = params.SIGN === sign && params.RES === 'OK';
	return platba;
};

/*
	@key {String}
	@params {Object} :: Request GET params
	@url {String}
	return {PlatbaSpracovanie}
*/
exports.PlatbaSpracovanieSporopay = function(key, params, url) {
	var platba = new PlatbaSpracovanie(params.result, params.vs, params.ss);
	var signature = [];

	signature.push(params.u_predcislo || '');
	signature.push(params.u_cislo || '');
	signature.push(params.u_kbanky || '');
	signature.push(params.pu_predcislo || '');
	signature.push(params.pu_cislo || '');

	signature.push(params.pu_kbanky || '');
	signature.push(params.suma || '');
	signature.push(params.mena || '');
	signature.push(params.vs || '');
	signature.push(params.ss || '');
	signature.push(url);
	signature.push(params.result || '');
	signature.push(params.real || '');

	var sign = sporopaySign(signature.join(';'), key);
	platba.jeZaplatena = params.SIGN2 === sign && params.RES.toLowerCase() === 'ok';

	return platba;
};

/*
	@key {String}
	@params {Object} :: Request GET params
	return {PlatbaSpracovanie}
*/
exports.PlatbaSpracovanieVebpay = function(key, params) {
	var platba = new PlatbaSpracovanie(params.RES, params.VS, params.SS);
	var sign = desSign((params.VS || '') + (params.SS || '') + (params.RES || ''), key);
	platba.jeZaplatena = params.SIGN === sign && params.RES === 'OK';
	return platba;
};

/*
	Vytvorenie požiadavky na platbu
	@cena {Number}
	@vs {String}
	@ks {String} :: optional
	@poznamka {String} :: optional
	@mena {String} :: optional (default EUR)
*/
exports.platba = function(cena, vs, ks, poznamka, mena) {
	return new Platba(cena, vs, ks, poznamka, mena);
};

function prepareNumber(num, doubleZero) {
	var str = num.toString().replace(',', '.');

	var index = str.indexOf('.');
	if (index > -1) {
		var len = str.substring(index + 1).length;
		if (len === 1)
			str += '0';
		if (len > 2)
			str = str.substring(0, index + 3);
	} else {
		if (doubleZero || true)
			str += '.00';
	}
	return str;
}

exports.version = 1005;
exports.Platba = Platba;