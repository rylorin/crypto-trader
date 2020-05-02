const Api = require('/Users/ronan/node_modules/crypto-exchange/node_modules/yobit/index.js')
let logResponse = {}

// Test public data APIs
var publicClient = new Api()
var privateClient = new Api('', '')

// get BTCUSD ticker
publicClient.getTicker(function(err,data){
    console.log(data)
    return true}, 'btc_usd')
    /**
// get BTCUSD Order Book
publicClient.getOrderBook(function(err,data){
    console.log(data)
    return true}, 'btc_usd')
// get BTCUSD trades
publicClient.getTrades(function(err,data){
    console.log(data)
    return true}, 'btc_usd')
**/

// get Account Balance
privateClient.getInfo(function(err,data){
    console.log(data)
    return true}, {})
