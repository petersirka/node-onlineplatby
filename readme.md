Slovenské online platby pre node.js
===================================

* Tatrabanka - tatrapay
* Tatrabanka - cardpay
* Slovenská sporiteľňa - sporopay
* VÚB banka - vubeplatby
* Volksbank - vebpay
* UniCredit Bank - uniplatba
* Poštová banka - platbaonline
* ČSOB platobné tlačítko - platobnetlacitko
* OTP Banka - otppay
* ASMS - platba cez SMS správu (skoro dokončené, musím to otestovať)
* __No dependencies__

> Ešte to nemám poriadne otestované ... ale kľúče mi sedeli všetky, návratové URL som skúšal len z Tatrabanky

***

```text
$ npm install onlineplatby
```

***

## Vytvorenie platby

```js
var platby = require('onlineplatby');

// maximálna dĺžka poznámky 30 znakov (overované)
// poznámka musí byť bez diakritiky ako aj UserName pri CardPay
// cena, VS, KS, poznámka
var platba = platby.platba(100.23, '201300001', '0308', 'platba poznamka');

platba.tatrapay('MID', 'KEY', 'return URL');
platba.cardpay('MID', 'KEY', 'return URL', 'Peter Sirka', '188.167.113.219');
platba.vubeplatby('MID', 'KEY', 'return URL');
platba.uniplatba('MID', 'KEY', 'return URL');
platba.vebpay('MID', 'KEY', 'return URL');
platba.sporopay('KEY', 'UCET/KOD', 'return URL');

// platbaonline nepodporuje podpísanie platby, preto je potrebné skontrolovať účet, či peniaze prišli
platba.platbaonline('nazov', 'return URL');

// otppay nepodporuje podpísanie platby, preto je potrebné skontrolovať účet, či peniaze prišli
platba.otppay('MID', 'return URL');

// platobnetlacitko nepodporuje podpísanie platby, preto je potrebné skontrolovať účet, či peniaze prišli
platba.platobnetlacitko('MID', 'UCET/KOD', 'return URL');

// na pozadí sa vygeneruje JavaScript, ktorý treba vložiť do stránky
// nižšie uvedená funkcia vygeneruje javascript
platba.toString();
```

```html
<a href="javascript:platbaTatrapay()">Zaplatiť cez Tatrapay</a>
<a href="javascript:platbaCardpay()">Zaplatiť cez Cardpay</a>
<a href="javascript:platbaVubeplatby()">Zaplatiť cez Vubeplatby</a>
<a href="javascript:platbaUniplatba()">Zaplatiť cez Uniplatba</a>
<a href="javascript:platbaVebpay()">Zaplatiť cez Vebpay</a>
<a href="javascript:platbaSporopay()">Zaplatiť cez Sporopay</a>
<a href="javascript:platbaPlatbaonline()">Zaplatiť cez Platbaonline</a>
<a href="javascript:platbaOtppay()">Zaplatiť cez Otppay</a>
<a href="javascript:platbaPlatobnetlacitko()">Zaplatiť cez Platobnetlacitko</a>
```

## Spracovanie platby

```js

var platby = require('onlineplatby');


// params musí byť objekt s URL parametrami
// príklad: require('querystring').parse('RES=OK&VS=12345678&SIGN=348SADUADSZIASDZ');

var platba = platby.PlatbaSpracovanieTatrapay('KEY', params);
var platba = platby.PlatbaSpracovanieCardpay('KEY', params);
var platba = platby.PlatbaSpracovanieVubeplatby('KEY', params);
var platba = platby.PlatbaSpracovanieUniplatba('KEY', params);
var platba = platby.PlatbaSpracovanieSporopay('KEY', params, tatoURLadresa_returnURL);
var platba = platby.PlatbaSpracovanieVebpay('KEY', params);

if (platba.JeZaplatena) {
	// OK
}

platba.JeZaplatena; // {Boolean}
platba.stav; // {String} OK, NO, TOOT
platba.VS; // {String} variabilný symbol

```

## Kontakt

<http://www.petersirka.sk>