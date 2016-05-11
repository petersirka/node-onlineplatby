Slovenské online platby pre node.js
===================================

> Nemal som možnosť všetko otestovať. V prípade problému ma kontaktujte.

* Tatra banka - tatrapay (hmac + des)
* Tatra banka - cardpay (hmac + des)
* Slovenská sporiteľňa - sporopay
* VÚB banka - vubeplatby
* Volksbank - vebpay
* UniCredit Bank - uniplatba
* Poštová banka - platbaonline
* ČSOB platobné tlačítko - platobnetlacitko
* OTP Banka - otppay
* ASMS - platba cez SMS správu (skoro dokončené, musím to otestovať)
* __No dependencies__

***

```text
$ npm install onlineplatby
```

***

## Vytvorenie platby

```js
var OP = require('onlineplatby');

// maximálna dĺžka poznámky 30 znakov (overované)
// poznámka musí byť bez diakritiky ako aj UserName pri CardPay
// cena, VS, KS, poznámka
// require('onlineplatby').create(amount, vs, cs, note)
var payment = OP.create(100.23, '201300001', '0308', 'platba poznamka');

// objekt platba obsahuje:
payment.amount;    // {Number}
payment.currency;  // {String}
payment.VS;        // {String}
payment.CS;        // {String} :: nie každá služba podporuje SS
payment.SS;        // {String} :: nie každá služba podporuje SS
payment.email;     // {String} :: nie každá služba podporuje notifikáciu
payment.phone;     // {String} :: nie každá služba podporuje notifikáciu
payment.note;      // {String} :: nie každá služba podporuje poznámku

// vygenerovanie platieb

payment.tatrapay('MID', 'KEY', 'return URL'); // HMAC
payment.cardpay('MID', 'KEY', 'return URL', 'Peter Sirka', '188.167.113.219'); // HMAC
payment.tatrapay2('MID', 'KEY', 'return URL'); // DES
payment.cardpay2('MID', 'KEY', 'return URL', 'Peter Sirka', '188.167.113.219'); // DES

payment.vubeplatby('MID', 'KEY', 'return URL');
payment.uniplatba('MID', 'KEY', 'return URL');
payment.vebpay('MID', 'KEY', 'return URL');
payment.sporopay('KEY', 'UCET/KOD', 'return URL');

// platbaonline nepodporuje podpísanie platby, preto je potrebné skontrolovať účet, či peniaze prišli
payment.platbaonline('nazov', 'return URL');

// otppay nepodporuje podpísanie platby, preto je potrebné skontrolovať účet, či peniaze prišli
payment.otppay('MID', 'return URL');

// platobnetlacitko nepodporuje podpísanie platby, preto je potrebné skontrolovať účet, či peniaze prišli
payment.platobnetlacitko('MID', 'UCET/KOD', 'return URL');

// na pozadí sa vygeneruje JavaScript, ktorý treba vložiť do stránky
// nižšie uvedená funkcia vygeneruje javascript
payment.toString();
```

```html
<a href="javascript:onlineplatby_tatrapay()">Zaplatiť cez Tatrapay</a>
<a href="javascript:onlineplatby_cardpay()">Zaplatiť cez Cardpay</a>
<a href="javascript:onlineplatby_vubeplatby()">Zaplatiť cez Vubeplatby</a>
<a href="javascript:onlineplatby_uniplatba()">Zaplatiť cez Uniplatba</a>
<a href="javascript:onlineplatby_vebpay()">Zaplatiť cez Vebpay</a>
<a href="javascript:onlineplatby_sporopay()">Zaplatiť cez Sporopay</a>
<a href="javascript:onlineplatby_platbaoline()">Zaplatiť cez Platbaonline</a>
<a href="javascript:onlineplatby_otppay()">Zaplatiť cez OTP Pay</a>
<a href="javascript:onlineplatby_platobnetlacitko()">Zaplatiť cez Platobnetlacitko</a>
```

## Spracovanie platby

```js

var OP = require('onlineplatby');

// params musí byť objekt s URL parametrami
// príklad: require('querystring').parse('RES=OK&VS=12345678&SIGN=348SADUADSZIASDZ');

var response = OP.process('tatrapay', 'KEY', params); // HMAC
var response = OP.process('cardpay', 'KEY', params); // HMAC
var response = OP.process('tatrapay2', 'KEY', params); // DES
var response = OP.process('cardpay2', 'KEY', params); // DES
var response = OP.process('vubeplatby', 'KEY', params);
var response = OP.process('uniplatba', 'KEY', params);
var response = OP.process('sporopay', 'KEY', params, current_process_url_address);
var response = OP.process('vebpay', 'KEY', params);

if (response.paid) {
	// OK
}

repsonse.paid;    // {Boolean}
repsonse.status;  // {String} OK, NO, TOOT
repsonse.VS;      // {String} variabilný symbol
repsonse.SS;      // {String} špecifický symbol
repsonse.note;    // {String} poznámka
```

## Kontakt

[Peter Širka](http://www.petersirka.eu), contact: <petersirka@gmail.com>
