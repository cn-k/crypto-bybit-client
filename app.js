import("bybit-api").NewSpotOrderV3;
const {
  InverseClient,
  LinearClient,
  InverseFuturesClient,
  SpotClient,
  SpotClientV3,
  UnifiedMarginClient,
  USDCOptionClient,
  USDCPerpetualClient,
  AccountAssetClient,
  CopyTradingClient,
} = require("bybit-api");

const API_KEY = "TXK5M7ANX5LLqAISNk";
const API_SECRET = "OLKW1Zj6N1MJNnXQsvH9gEIt3N8yWweBDL5j";
const useTestnet = false;
const URL = "https://api.bybit.com";

function getClient() {
  return new SpotClientV3({
    key: API_KEY,
    secret: API_SECRET,
    testnet: useTestnet,
  });
}

/*
client.getSymbols()
  .then(res => {
    console.log("getSymbols result: ", res.result);
  })
  */
/*
  symbol: string;
  orderQty: string;
  side: OrderSide;
  orderType: OrderTypeSpot;
  timeInForce?: OrderTimeInForce;
  orderPrice?: string;
  orderLinkId?: string;
  orderCategory?: 0 | 1;
  triggerPrice?: string;
  */
function buyMarketOrder(symbol, orderQty) {
  var client = getClient();
  var buyOrder = {
    symbol: symbol,
    orderQty: orderQty,
    side: "Buy",
    orderType: "MARKET",
    orderCategory: 0,
    //triggerPrice: "0.461"
  };
  client
    .submitOrder(buyOrder)
    .then((res) => {
      console.log("submitOrder msg: ", res.retMsg);
      console.log("submitOrder code: ", res.retCode);
      console.log("submitOrder code: ", res.result);
    })
    .catch((err) => {
      console.log(err);
    });
}
function sellTPSLOrder(symbol, orderQty, triggerPrice) {
  client = getClient();
  console.log("triggerprice" + triggerPrice);
  console.log("orderQty" + orderQty);
  var sellOrder = {
    symbol: symbol,
    orderQty: orderQty,
    side: "Sell",
    orderType: "LIMIT",
    orderPrice: triggerPrice,
    orderCategory: 1,
    triggerPrice: triggerPrice,
  };
  client
    .submitOrder(sellOrder)
    .then((res) => {
      console.log("submitOrder msg: ", res.retMsg);
      console.log("submitOrder code: ", res.retCode);
      console.log("submitOrder code: ", res.result);
    })
    .catch((err) => {
      console.log(err);
    });
}
function buyOrder(symbol, orderQty, orderPrice, triggerPrice) {
  buyMarketOrder(symbol, orderQty);
  triggerPrice = (orderPrice / 100) * 99;
  setTimeout(() => {
    sellTPSLOrder(symbol, orderQty, triggerPrice.toString());
  }, 1000);
}
function pastOrders() {
  client = getClient();
  client
    .getPastOrders("DLCUSDT", undefined, undefined, 0)
    .then((res) => {
      console.log("getOpenOrders msg: ", res.retMsg);
      console.log("getOpenOrders code: ", res.retCode);
      console.log(
        "getOpenOrders result: ",
        JSON.stringify(res.result, null, "\t")
      );
    })
    .catch((err) => {
      console.log(err);
    });
}

async function openOrders(symbol, orderCategory) {
  var timestamp = Date.now();
  var queryParam = "symbol=" + symbol + "&orderCategory=" + orderCategory;
  //console.log(queryParam);
  var queryString = timestamp + API_KEY + 5000 + queryParam;
  var CryptoJS = require("crypto-js");
  var signature = CryptoJS.HmacSHA256(queryString, API_SECRET).toString();
  var myHeaders = new Headers();
  myHeaders.append("X-BAPI-SIGN", signature);
  myHeaders.append("X-BAPI-API-KEY", API_KEY);
  myHeaders.append("X-BAPI-TIMESTAMP", timestamp);
  myHeaders.append("X-BAPI-RECV-WINDOW", "5000");

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };
  var res = await fetch(
    URL + "/spot/v3/private/open-orders?" + queryParam,
    requestOptions
  );
  const data = await res.json();
  //console.log(data);
  var activeOrdersList = data.result.list;
  //console.log(activeOrdersList);
  return activeOrdersList;
}

//zxc()
//checkProfit()
//buyOrder("DLCUSDT", "10", "0.10", "0.10")
async function getBalance() {
  res = await getClient().getBalances();
  return JSON.parse(JSON.stringify(res.result, null, "\t")).balances;
}
async function activeOrders() {
  var input = { orderCategory: 0 };
  res = await getClient().getOrder(input);
  console.log(JSON.stringify(res.result, null, "\t"));
  return JSON.parse(JSON.stringify(res.result, null, "\t"));
}

async function askPrice(symbol) {
  res = await getClient().getBestBidAskPrice(symbol);
  //console.log(JSON.stringify(res.result, null, "\t"));
  return JSON.parse(JSON.stringify(res.result, null, "\t"));
}
function calculate99Price(price, length) {
  console.log("price??? ", price);
  console.log("typeof ", typeof price);
  console.log("length ", length);
  orderPrice = (price / 100) * 99;
  console.log("orderPrice", orderPrice);
  finalRes = orderPrice.toFixed(length - 1);
  console.log("PRICE!!!", finalRes);
  return finalRes;
}
/*
async function openOrders() {
  res = await getClient().getOpenOrders("DLCUSDT", undefined, undefined, 1);
  return JSON.parse(JSON.stringify(res, null, "\t"));
}
*/

//buyMarketOrder("DLCUSDT", "3");

/**
 * loop in balances and if not usdt check open orders type 1
 **/
// let [someResult, anotherResult] = await Promise.all([someCall(), anotherCall()]);
async function test() {
  const balanceRes = await getClient()
    .getBalances()
    .then((balances) => balances.result);
  const balances = balanceRes.balances;
  for (i = 0; i < balances.length; i++) {
    let balance = balances[i];
    let coin = balance.coin;
    let coin_pair = coin + "USDT";
    if (coin != "USDT" && coin != "BIT") {
      //console.log("coin_pair", coin_pair);
      var orders = await openOrders(coin_pair, 1);
      //console.log(orders);
      if (orders.length == 0) {
        console.log("length == 0");
        var currentPrice = await getClient()
          .getBestBidAskPrice(coin_pair)
          .then((res) => res.result);
        let priceLength = currentPrice.askPrice.toString().split(".")[1].length;
        //if (coin_pair == "ETHUSDT") {
        //console.log(currentPrice);
        //console.log("coin pair", coin_pair);
        sellPrice = calculate99Price(currentPrice.askPrice, priceLength);
        sellTPSLOrder(coin_pair, balance.free, sellPrice);
        //}
      } else {
        var currentPrice = await getClient()
          .getBestBidAskPrice(coin_pair)
          .then((res) => res.result);
        let priceLength = currentPrice.askPrice.toString().split(".")[1].length;
        sellPrice = calculate99Price(currentPrice.askPrice, priceLength);
        //console.log(orders);
        order = orders[0];
        if (order.triggerPrice < sellPrice) {
        //if (true) {
          console.log("length != 0");
          cancelOrdr = {
            orderId: order.orderId,
            orderLinkId: order.orderLinkId,
            orderCategory: 1,
          };
          getClient()
            .cancelOrder(cancelOrdr)
            .then((cancelOrder) => {
              //console.log("rescode --- ", cancelOrder.retCode);
              //console.log("resMsg --- ", cancelOrder.retMsg);
              //console.log("res result --- ", cancelOrder.result);
              sellTPSLOrder(coin_pair, balance.total, sellPrice);
            })
            .catch((err) => {
              console.log(err);
            });
          //console.log(balance);
          //console.log("cancel order");
        }
      }
    }
  }
  return balances;
}

test();
/*
getBalance().then((balances) => {
  for (i = 0; i < balances.length; i++) {
    let balance = balances[i];
    //console.log(balance);
    //console.log("\n----");
    let coin = balance.coin;
    console.log("balance coin", coin);
    let coin_pair = coin + "USDT";
    if (coin != "USDT") {
      var orders = await openOrders(coin_pair, 1);
      console.log(orders);
      
      openOrders(coin_pair, 1).then((order) => {
        console.log(coin, order.length);
        console.log("!!!!!!!!!!!!!!!!!!!");
        //console.log(order);
        if (order.length == 0) {
          askPrice(coin_pair).then((currentPrice) => {
            console.log(currentPrice.askPrice);
            sellPrice = calculate99Price(currentPrice.askPrice);
            console.log(sellPrice);
            sellTPSLOrder(coin_pair, balance.free, sellPrice);
          });

          //console.log(askPrice(coin_pair));
          //calculate99Price()
        }
      });
     
    }
  }
});

//sellTPSLOrder("DLCUSDT", "22", "0.1");
//getBalance();
//openOrders = openOrders("DLCUSDT", 1);
//openOrders.then((orders) => console.log(orders));
*/
