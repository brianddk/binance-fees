// [rights]  Copyright Dan B. (brianddk) 2017 https://github.com/brianddk
// [license] Licensed under Apache 2.0 https://www.apache.org/licenses/LICENSE-2.0
// [repo]    https://github.com/brianddk/binance-fees
// [tips]    LTC: LQjSwZLigtgqHA3rE14yeRNbNNY2r3tXcA
//
var rp = require('request-promise');
var bluebird = require('bluebird');
var cheerio = require('cheerio')

// Globals (parameterize later).
var bMarkdown = false;; // else CSV
var bTruncate = false;; // only list < $1

function jsonReq(url, bParse) {
    return rp({
        uri: url,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: bParse
    });
} 

var binanceExch = jsonReq('https://api.binance.com/api/v1/exchangeInfo', true);
var binanceQuot = jsonReq('https://api.binance.com/api/v3/ticker/price', true);
var gdaxBtcQuot = jsonReq('https://api.gdax.com/products/BTC-USD/ticker', true);
var gdaxEthQuot = jsonReq('https://api.gdax.com/products/ETH-USD/ticker', true);
//var binanceFees = jsonReq('https://support.binance.com/hc/en-us/articles/115000429332-Fee-Structure-on-Binance', false);
// URI changed to https://www.binance.com/fees.html... have to recode... temp hack to use archive URI
var binanceFees = jsonReq('http://web.archive.org/web/20180106214515/https://support.binance.com/hc/en-us/articles/115000429332-Fee-Structure-on-Binance', false);
//var gdaxExch     = rp('https://api.gdax.com/products/');

bluebird.all([binanceExch, binanceQuot, gdaxBtcQuot, gdaxEthQuot, binanceFees])
    .spread(function (exch, quote, btc, eth, feeHtml) {
        var $ = cheerio.load(feeHtml);

        var feelist = {};
        var $rows = $("tbody tr");
        $rows.each(function(i) {
            if (!i) return;
            var text = $(this).text();
            var lines = text.split('\n');
            if (lines.length < 6) return;
            var coin = lines[5].trim();
            var fee = lines[4].trim();
            if (isNaN(fee)) fee = 0;
            feelist[coin] = {};
            feelist[coin]["fee"] = fee;
        });
        
        var quotelist = {}
        for(var i in quote) {
            var q = quote[i];
            quotelist[q.symbol] = {};
            quotelist[q.symbol]["price"] = q.price;            
        }
        
        var usdPrice = {}
        usdPrice["BTC"]  = btc.price;
        usdPrice["ETH"]  = eth.price;
        usdPrice["USDT"] = Math.min(btc.price / quotelist["BTCUSDT"].price,
                                    eth.price / quotelist["ETHUSDT"].price);
        usdPrice["BNB"]  = Math.min(btc.price * quotelist["BNBBTC"].price,
                                    eth.price * quotelist["BNBETH"].price);
                                    
        var pricelist = {};
        for(var i in exch.symbols) {
            var symbol = exch.symbols[i].symbol;
            var coin = exch.symbols[i].baseAsset;
            var counter = exch.symbols[i].quoteAsset;
            if (!quotelist[symbol] ||
                !usdPrice[counter] ||
                !feelist[coin] ) {
                //console.log(coin + "; " + counter + "; " + symbol);
                continue;
            }
            if(counter != "BTC" && counter != "ETH" && 
               counter != "BNB" && counter != "USDT") {continue;}
            for(var j in exch.symbols[i].filters) {
                var ftype = exch.symbols[i].filters[j].filterType;
                if (ftype == "LOT_SIZE") {
                    break;
                }
            }
            var minLot = exch.symbols[i].filters[j].minQty;
            
            var priceUsd = usdPrice[counter];            
            var price = quotelist[symbol].price;
            var fee = feelist[coin].fee;
            pricelist[symbol] = {};
            pricelist[symbol]["coin"] = coin;
            pricelist[symbol]["counter"] = counter;
            pricelist[symbol]["minLot"] = minLot;
            pricelist[symbol]["price"] = price * minLot;
            pricelist[symbol]["priceUsd"] = price * minLot * priceUsd;            
            pricelist[symbol]["feeUsd"] = fee * price * priceUsd;
        }
        
        var sortedKeys = [];
        for(var symbol in pricelist) {
            var n = {};
            n["symbol"] = symbol;
            n["maxUsd"] = Math.max(pricelist[symbol].priceUsd, pricelist[symbol].feeUsd)
            if(bTruncate && n.maxUsd > 1.0) { continue; } 
            sortedKeys.push(n);
        }
        
        sortedKeys.sort(function(a, b) {
            return a.maxUsd - b.maxUsd;
        });
        
        var header=`
Key

- **symbol** - The currency pair being traded.
- **coin** - The coin being bought.
- **counter** - The currency used to pay for the purchase (counter currency).
- **minLot** - The smallest amount of the coin that can be purchased.
- **price** - The market price for the smallest amount of the coin.
- **lotUsd** - The cost to buy the smallest amount in equivical USD.
- **feeUsd** - The withdrawl fee for that coin (if paid in USD).

|symbol|coin|counter|minLot|price|lotUsd|feeUsd|
|---|---|---|---|---|---|---|`

        if(bMarkdown) {
            console.log(header);
            for(var i in sortedKeys) {
                var symbol = sortedKeys[i].symbol;
                var p = pricelist[symbol];
                var line = "|" + symbol + "|" + 
                    p.coin + "|" +
                    p.counter + "|" +
                    Number(p.minLot).toFixed(6) + "|" +
                    Number(p.price).toFixed(8) + "|" +
                    Number(p.priceUsd).toFixed(4) + "|" +
                    Number(p.feeUsd).toFixed(4) + "|";
                console.log(line);
            }
        }
        else {
            console.log("symbol,coin,counter,minLot,price,lotUsd,feeUsd-STALE")
            for(var i in sortedKeys) {
                var symbol = sortedKeys[i].symbol;
                var p = pricelist[symbol];
                var line = symbol + "," + 
                    p.coin + "," +
                    p.counter + "," +
                    Number(p.minLot) + "," +
                    Number(p.price) + "," +
                    Number(p.priceUsd) + "," +
                    Number(p.feeUsd);
                console.log(line);
            }
        }
    })
    .catch(function (err) {
        err.name = err.name || 'NA';
        err.error = err.error || 'NA';
        err.options = err.options || {};
        err.options.uri = err.options.uri || 'NA'
        console.log(err.name);
        console.log("  " + err.options.uri);
        console.log("    " + err.message);
    });
