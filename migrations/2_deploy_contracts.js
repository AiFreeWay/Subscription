const ConvertLib = artifacts.require("ConvertLib");
const Subscriber = artifacts.require("Subscriber");
const Subscription = artifacts.require("Subscription");

module.exports = function(deployer) {

  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, Subscription);
  deployer.deploy(Subscription, [0, 1], [10000000000000, 30000000000000]);
  deployer.link(ConvertLib, Subscriber);
  deployer.deploy(Subscriber);
};
