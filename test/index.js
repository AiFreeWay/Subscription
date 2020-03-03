const DeployedAddresses = require("truffle")["DeployedAddresses"];
const Subscriber = artifacts.require("Subscriber");
const Subscription = artifacts.require("Subscription");

contract("Subscription && Subscriber", async accounts => {
  //!!! Default Subscription creates with 2 subscription ids: [0, 1] and prices: [10000000000000, 30000000000000]

  //SUBSCRIPTION

  it("Get subscription count", async () => {
    let contract = await Subscription.deployed();
    await contract.getSubscriptionsCount({gasPrice: 1000000000 })
      .then(count => assert.equal(count, 2));
  });

  it("Get subscription price", async () => {
    let contract = await Subscription.deployed();
    let error;
    await contract.getSubscriptionPrice(0, {gasPrice: 1000000000 })
      .then(price => {
        assert.equal(price, 10000000000000);
        return contract.getSubscriptionPrice(1, {gasPrice: 1000000000 })
      })
      .then(price => {
        assert.equal(price, 30000000000000);
        return contract.getSubscriptionPrice(2, {gasPrice: 1000000000 })
      })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Subscription not exist") > 0);
  });

  it("Add subscription", async () => {
    let contract = await Subscription.deployed();
    let error;
    await contract.addSubscription(2, 20000000000000, {from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contract.addSubscription(2, 20000000000000, {gasPrice: 1000000000 })
      .then(() => {
        return contract.getSubscriptionPrice(2, {gasPrice: 1000000000 })
      })
      .then(price => assert.equal(price, 20000000000000))
  });

  it("Update subscription", async () => {
    let contract = await Subscription.deployed();
    let error;
    await contract.updateSubscription(2, 40000000000000, {from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contract.updateSubscription(4, 40000000000000, {gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Subscription not exist") > 0);

    await contract.updateSubscription(2, 40000000000000, {gasPrice: 1000000000 })
      .then(() => {
        return contract.getSubscriptionPrice(2, {gasPrice: 1000000000 })
      })
      .then(price => assert.equal(price, 40000000000000))
  });

  it("Remove subscription", async () => {
    let contract = await Subscription.deployed();
    let error;
    await contract.removeSubscription(2, {from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contract.removeSubscription(4, {gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Subscription not exist") > 0);

    await contract.removeSubscription(2, {gasPrice: 1000000000 })
      .then(() => {
        return contract.getSubscriptionPrice(2, {gasPrice: 1000000000 })
      })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Subscription not exist") > 0);
  });

  //SUBSCRIBER

  it("Buy subscription", async () => {
    let contractSubscription = await Subscription.deployed();
    let contractSubscriber = await Subscriber.deployed();
    let error;
    await contractSubscriber.buySubscription(contractSubscription.address,
      0, 15000000000000, {from: accounts[1], value: 30000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contractSubscriber.buySubscription(contractSubscription.address,
      1, 15000000000000, {value: 30000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Not enought amount") > 0);

    await contractSubscriber.buySubscription(contractSubscription.address,
      2, 15000000000000, {value: 30000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Subscription not exist") > 0);

    let subscriptionBalanceBefore;
    let account0BalanceBefore;
    await web3.eth.getBalance(contractSubscription.address)
      .then(balance => {
        subscriptionBalanceBefore = balance;
        return web3.eth.getBalance(accounts[0]);
      })
      .then(balance => {
        account0BalanceBefore = balance;
        return contractSubscriber.buySubscription(contractSubscription.address,
          0, 15000000000000, {value: 16000000000000, gasPrice: 1000000000 });
      })
      .then(() => {
        return web3.eth.getBalance(contractSubscription.address);
      })
      .then(balance => {
        assert.ok(subscriptionBalanceBefore < balance);
        return web3.eth.getBalance(accounts[0]);
      })
      .then(balance => {
        assert.ok(account0BalanceBefore > balance);
        return contractSubscriber.getSubscriptionsCount({ gasPrice: 1000000000 });
      })
      .then(count => assert.equal(count, 1));
  });

  it("Sell subscription", async () => {
    let contractSubscription = await Subscription.deployed();
    let contractSubscriber = await Subscriber.deployed();
    let error;
    await contractSubscriber.sellSubscription(contractSubscription.address, 0, 5000000000000, {from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contractSubscriber.sellSubscription(contractSubscription.address, 0, 5000000000000, {gasPrice: 1000000000 })
      .then(() => contractSubscriber.getSubscriptionsForSellCount({ gasPrice: 1000000000 }))
      .then(count => {
        assert.equal(count, 1);
        return contractSubscriber.getSubscriptionForSellPrice(contractSubscription.address, 0, { gasPrice: 1000000000 });
      })
      .then(price => assert.equal(price, 5000000000000));

    await contractSubscriber.abortSellSubscription(contractSubscription.address, 0, {from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contractSubscriber.abortSellSubscription(contractSubscription.address, 0, {gasPrice: 1000000000 })
      .then(() => contractSubscriber.getSubscriptionsForSellCount({ gasPrice: 1000000000 }))
      .then(count => assert.equal(count, 0));
  });

  it("Buy subscription from other account", async () => {
    let contractSubscription = await Subscription.deployed();
    let contractSubscriber = await Subscriber.deployed();
    let contractSecondSubscriber = await Subscriber.new({from: accounts[1]});

    let error;
    await contractSecondSubscriber.buySubscriptionFromContract(contractSubscriber.address,
      contractSubscription.address, 0, 5000000000000, {from: accounts[0], value: 7000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contractSecondSubscriber.buySubscriptionFromContract(contractSubscriber.address,
      contractSubscription.address, 0, 5000000000000, {from: accounts[1], value: 7000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Subscription not sell") > 0);

    await contractSubscriber.sellSubscription(contractSubscription.address, 0, 5000000000000, {gasPrice: 1000000000 });

    await contractSecondSubscriber.buySubscriptionFromContract(contractSubscriber.address,
      contractSubscription.address, 0, 4000000000000, {from: accounts[1], value: 7000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Not enought amount") > 0);

    let subscriberBalanceBefore;
    let account1BalanceBefore;
    await web3.eth.getBalance(contractSubscriber.address)
      .then(balance => {
        subscriberBalanceBefore = balance;
        return web3.eth.getBalance(accounts[1]);
      })
      .then(balance => {
        account1BalanceBefore = balance;
        return contractSecondSubscriber.buySubscriptionFromContract(contractSubscriber.address,
          contractSubscription.address, 0, 5000000000000, {from: accounts[1], value: 7000000000000, gasPrice: 1000000000 });
      })
      .then(() => {
        return web3.eth.getBalance(contractSubscriber.address);
      })
      .then(balance => {
        assert.ok(subscriberBalanceBefore < balance);
        return web3.eth.getBalance(accounts[1]);
      })
      .then(balance => {
        assert.ok(account1BalanceBefore > balance);
        return contractSecondSubscriber.isSubscriptionBuy(contractSubscription.address, 0, {gasPrice: 1000000000 });
      })
      .then(isBuy => {
        assert.equal(isBuy, true);
        return contractSubscriber.isSubscriptionBuy(contractSubscription.address, 0, {gasPrice: 1000000000 });
      })
      .then(isBuy => assert.equal(isBuy, false));
  });

  it("Sell account", async () => {
    let contractSubscription = await Subscription.deployed();
    let contractSubscriber = await Subscriber.deployed();
    let error;
    await contractSubscriber.sellAccount(10000000000000, {from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contractSubscriber.sellAccount(10000000000000, {gasPrice: 1000000000 })
      .then(() => contractSubscriber.getIsAccountSell({ gasPrice: 1000000000 }))
      .then(isSell => {
        assert.equal(isSell, true);
        return contractSubscriber.getAccountSellPrice({ gasPrice: 1000000000 })
      })
      .then(price => assert.equal(price, 10000000000000));

    await contractSubscriber.abortSellAccount({from: accounts[1], gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);

    await contractSubscriber.abortSellAccount({gasPrice: 1000000000 })
      .then(() => contractSubscriber.getIsAccountSell({ gasPrice: 1000000000 }))
      .then(isSell => assert.equal(isSell, false));
  });

  it("Buy account", async () => {
    let contractSubscription = await Subscription.deployed();
    let contractSubscriber = await Subscriber.deployed();
    let error;
    await contractSubscriber.buyAccount({from: accounts[1], value: 15000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Account not sell") > 0);

    await contractSubscriber.sellAccount(10000000000000, {gasPrice: 1000000000 });

    await contractSubscriber.buyAccount({from: accounts[1], value: 5000000000000, gasPrice: 1000000000 })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Not enought amount") > 0);

    let account0BalanceBefore;
    let account1BalanceBefore;
    await web3.eth.getBalance(accounts[0])
      .then(balance => {
        account0BalanceBefore = balance;
        return web3.eth.getBalance(accounts[1]);
      })
      .then(balance => {
        account1BalanceBefore = balance;
        return contractSubscriber.buyAccount({from: accounts[1], value: 15000000000000, gasPrice: 1000000000 });
      })
      .then(() => {
        return web3.eth.getBalance(accounts[0]);
      })
      .then(balance => {
        assert.ok(account0BalanceBefore < balance);
        return web3.eth.getBalance(accounts[1]);
      })
      .then(balance => {
        assert.ok(account1BalanceBefore > balance);
        return contractSubscriber.sellAccount(10000000000000, {gasPrice: 1000000000 });
      })
      .catch(err => { error = err });
    assert.ok(error.toString().indexOf("Need owner permission") > 0);
  });
});
