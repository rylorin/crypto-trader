/*
 * Libraries
 *
 * https://www.npmjs.com/package/crypto-exchange
 */
const Exchanges = require('crypto-exchange');

/*
 * init and globals
 */
const default_percent = 10; // default pricing gap in percent
const default_refresh = 11; // default refresh timeout in mins

// pairs that we will trade. Each entry is a pair. Value is ...
var trading_pairs;
var trading_pairs_html;
var alerts_html;

const exchanges_url = {
		'binance': 'https://binance.com/',
		'bitfinex': 'https://bitfinex.com/',
		'bittrex': 'https://bittrex.com/',
		'gdax': 'https://gdax.com/',
		'kraken': 'https://kraken.com/',
		'liqui': 'https://liqui.io/',
		'poloniex': 'https://poloniex.com/',
};
//array of our Exchanges objects
var exchanges = [];
exchanges['binance'] = new Exchanges.binance({
  key: 'KQQMAJ8kQ1g8muruZkXPoGgMmfyVbmbY4zBZQsL15T9UhBYSDHiccpne',
  secret: ''
});
exchanges['bitfinex'] = new Exchanges.bitfinex({
	key: 'KQQMAJ8kQ1g8muruZkXPoGgMmfyVbmbY4zBZQsL15T9UhBYSDHiccpne',
	secret: ''
});
exchanges['bittrex'] = new Exchanges.bittrex({
	key: 'KQQMAJ8kQ1g8muruZkXPoGgMmfyVbmbY4zBZQsL15T9UhBYSDHiccpne',
	secret: ''
});
exchanges['gdax'] = new Exchanges.gdax({
	key: 'KQQMAJ8kQ1g8muruZkXPoGgMmfyVbmbY4zBZQsL15T9UhBYSDHiccpne',
	secret: ''
});
exchanges['kraken'] = new Exchanges.kraken({
	key: 'KQQMAJ8kQ1g8muruZkXPoGgMmfyVbmbY4zBZQsL15T9UhBYSDHiccpne',
	secret: ''
});
exchanges['liqui'] = new Exchanges.liqui({
	key: 'KQQMAJ8kQ1g8muruZkXPoGgMmfyVbmbY4zBZQsL15T9UhBYSDHiccpne',
	secret: ''
});
exchanges['poloniex'] = new Exchanges.poloniex({
	key: 'YSJVAQYN-7T376DD5-16GGXIS3-PRMKY11N',
	secret: ''
});

// exchanges['liqui'].assets().then(console.log);
// exchanges['poloniex'].ticker([ 'ETH_BTC', 'LTC_BTC']).then(console.log);

/*
 * Initialize
 */
function initialize() {
//	console.log("initialize...");
	trading_pairs = new Object();
	Exchanges.pairs().then(function(data) {
		for (var pair in data) {
			let e = new Object();
			let len = 0;
			for (var i in data[pair]) {
				if (Object.keys(exchanges).includes(data[pair][i])) {
					e[data[pair][i]] = undefined;
					len += 1;
				}
			}
			if (len >= 2) {
				trading_pairs[pair] = e;
			}
		}

		console.log("trading pairs/exchanges:");
		console.log(trading_pairs);

		update();
		setInterval(update, 60 * 1000 * default_refresh); // update every x secs
	}, function(raison) {
	    // Rejet de la promesse
		console.log('could not initialize: ' + raison);
		process.exit(-1);
	});
}

/*
 * Tickers update
 */
function tickers_update(exchange, data) {
//	console.log('tickers_update');
//	console.log(exchange);
	for (var p in data) {
		trading_pairs[p][exchange] = data[p]['last'];
	}
	recalculate();
}
function update() {
//	console.log("updating...");
	for (var e in exchanges) {
		let pairs = [];
		for (var p in trading_pairs) {
			if (Object.keys(trading_pairs[p]).includes(e)) {
//				if ((e != 'poloniex') || (pairs.length < 8)) {	// limit for Poloniex for now
					pairs.push(p);
//				}
			}
		}
		exchanges[e].ticker(pairs).then(tickers_update.bind(null, e), function(raison) {
		    // Rejet de la promesse
			console.log('could not get tickers for exchange: ' + e + ', error: ' + raison);
		});
	}
}

/*
 * Evaluate trading conditions
 */
function recalculate() {
//	console.log("recalculating...");
	let max_spread = 0;
	let max_pair = 'BTC_USD';
	let alerts = '';
	let details = [];
	for (var p in trading_pairs) {
		let min = undefined;
		let max = undefined;
		let sum = 0;
		let count = 0;
		let line = '';
		line += '<tr id=' + p + '><td><div class="s-s-' + p.split('_')[0].toLowerCase() + ' currency-logo-sprite"></div></td><td>' + p + '</td>';
		for (var e in exchanges) {
			if (min == undefined) { min = trading_pairs[p][e]; mine = e; }
			if (max == undefined) { max = trading_pairs[p][e]; maxe = e; }
			if (trading_pairs[p][e] < min) { min = trading_pairs[p][e]; mine = e; }
			if (trading_pairs[p][e] > max) { max = trading_pairs[p][e]; maxe = e; }
			if (trading_pairs[p][e] != undefined) {
				count++;
				sum += trading_pairs[p][e];
				line += '<td>' + trading_pairs[p][e] + '</td>';
			} else {
				line += '<td></td>';
			}
		}
		spread = Math.round((max/min-1) * 100);
		if ((min != undefined) && (max != undefined) && (spread > default_percent)) {
			console.log(p + ' trade alert: min = ' + min + '@' + mine + ', max = ' + max + '@' + maxe + ', spread = ' + spread + '%');
			alerts += '<p><a href=#' + p + '>' + p + '</a> <font color=red>trade alert: min = ' + min + '@<a href="' + exchanges_url[mine] + '">' + mine + '</a>, max = ' + max + '@<a href="' + exchanges_url[maxe] + '">' + maxe + '</a>, spread = ' + Math.round((max/min-1)*100) + '%</font></p>\n';
		}
		line += '<td text-align=right>' + spread + '%</td>';
		line += '<td>' + (sum / count) + '</td>';
		line += '</tr>\n';
		if (spread > max_spread) {
			max_spread = spread;
			max_pair = p;
		}
		if (details[p.split('_')[1]] == undefined) { details[p.split('_')[1]] = '' };
		details[p.split('_')[1]] += line;
	}
	// alerts
	let best = 'max spread ' + max_spread + '% on <a href=#' + max_pair + '>' + max_pair + '</a>';
	alerts_html = '<div>' + best + '</div>' + '<div>' + alerts + '</div>';
	// details
	let s = '';
	// build details table here
	for (let d in details) {
		s += '<h2>' + d + ' markets</h2>\n';
		s += '<table>';
		s += '<tr><th></th><th>market</th>';
		for (var e in exchanges) {
			s += '<th>' + e + '</th>';
		}
		s += '<th>spread</th><th>average</th></tr>\n';
		s +=  details[d];
		s += '</table>\n<br/>\n';
	}
	trading_pairs_html = s;
}

initialize();

/*
 * Web server
 */
var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 8080));
app.use('/public', express.static(__dirname + '/public'));
// app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function(request, response) {
//	console.log("Got a GET request for the homepage");
	let s = '';
	s += '<html>\n<title>crypto-alert</title>\n<link href="./public/main.css" rel="stylesheet">\n<link href="./public/sprites/all_views_all_0.css" rel="stylesheet">\n<body>\n';
	s += alerts_html;
	s += trading_pairs_html;
	s += '</body>\n</html>';
	response.send(s);
})

var server = app.listen(app.get('port'), function() {
	var host = server.address().address
	var port = server.address().port
	console.log("Server app listening at http://%s:%s", host, port)
})