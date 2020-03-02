## Solidity subscription smart contracts
#### Description
This contracts set allow users buy and sell subscriptions for digital assets.

Subscription contract can:
1. Create and manage many subscriptions
2. Sell subscriptions
3. Get information about subscription

Subscriber contract can:
1. Buy subscription
2. Sell its account for other user
3. Get informatin abount subscriptions

Contracts are fully tested, you can see
[tests here](https://github.com/AiFreeWay/Subscription/blob/master/test/index.js)

Builded and tested with Solidity and Ethereum truffle.
Security analyzed with Mythx.

#### Installation guide
You need install <b>Nodejs</b> before
```
git clone https://github.com/Subscription/ChickBoom
cd ChickBoom
npm install
truffle test test/index.js
