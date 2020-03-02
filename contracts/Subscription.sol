pragma solidity ^0.6.3;

import "./SubscriberInterface.sol";
import "./SubscriptionInterface.sol";

contract Subscription is SubscriptionInterface {

    struct SubscriptionPrice {
        uint256 price;
        bool isExist;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Need owner permission");
        _;
    }

    modifier isSubscriptionExists(uint16 id) {
        require(subscriptions[id].isExist, "Subscription not exist");
        _;
    }

    event NewSubscription(
        uint16 indexed newSubscriptionsId,
        uint256 price
    );

    event UpdateSubscription(
        uint16 indexed updateSubscriptionsId,
        uint256 oldPrice,
        uint256 price
    );

    event RemoveSubscription(
        uint16 indexed removedSubscriptionsId
    );

    address private owner;
    mapping(uint16 => SubscriptionPrice) private subscriptions;
    uint16 private subscriptionsCount;

    constructor(uint16[] memory ids, uint256[] memory prices) public {
        require(ids.length == prices.length, "Invalid input data, ids and prices must have same length");
        for (uint16 i; i<ids.length; i++) {
            subscriptions[ids[i]] = SubscriptionPrice(prices[i], true);
        }
        subscriptionsCount = uint16(ids.length);
        owner = msg.sender;
    }

    function buy(uint16 id) external payable override isSubscriptionExists(id) {
        require(msg.value >= subscriptions[id].price, "Not enought amount");
        SubscriberInterface(msg.sender).confirmSubscription(id);
    }

    function addSubscription(uint16 id, uint256 price) external onlyOwner returns(uint16) {
        require(!subscriptions[id].isExist, "Subscription already added");
        subscriptions[id] = SubscriptionPrice(price, true);
        subscriptionsCount += 1;
        emit NewSubscription(id, price);
    }

    function updateSubscription(uint16 id, uint256 price) external onlyOwner isSubscriptionExists(id) returns(uint16) {
        uint256 oldPrice = subscriptions[id].price;
        subscriptions[id] = SubscriptionPrice(price, true);
        emit UpdateSubscription(id, oldPrice, price);
    }

    function removeSubscription(uint16 id) external onlyOwner isSubscriptionExists(id) {
        delete subscriptions[id];
        subscriptionsCount -= 1;
        emit RemoveSubscription(id);
    }

    function getSubscriptionsCount() public view returns(uint16) {
        return subscriptionsCount;
    }

    function getSubscriptionPrice(uint16 id) public view isSubscriptionExists(id) returns(uint256) {
        return subscriptions[id].price;
    }
}
