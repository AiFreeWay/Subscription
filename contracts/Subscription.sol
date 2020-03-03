pragma solidity ^0.6.3;

contract Subscription {

    modifier onlyOwner() {
        require(msg.sender == owner, "Need owner permission");
        _;
    }

    modifier isSubExists(uint16 id) {
        require(subscriptions[id].isExist, "Subscription not exist");
        _;
    }

    struct SubPrice {
        uint256 price;
        bool isExist;
    }

    event NewSubscription(
        uint16 indexed id,
        uint256 price
    );

    event UpdateSubscription(
        uint16 indexed id,
        uint256 oldPrice,
        uint256 price
    );

    event RemoveSubscription(
        uint16 indexed id
    );

    address private owner;
    uint16 private subsCount;
    mapping(uint16 => SubPrice) private subscriptions;


    constructor(uint16[] memory ids, uint256[] memory prices) public {
        require(ids.length == prices.length, "Invalid input data, ids and prices must have same length");
        for (uint16 i; i<ids.length; i++) {
            subscriptions[ids[i]] = SubPrice(prices[i], true);
        }
        subsCount = uint16(ids.length);
        owner = msg.sender;
    }

    function subscribe(uint16 id) external payable isSubExists(id) {
        require(msg.value >= subscriptions[id].price, "Not enought amount");
    }

    function addSubscription(uint16 id, uint256 price) external onlyOwner returns(uint16) {
        require(!subscriptions[id].isExist, "Subscription already added");
        subscriptions[id] = SubPrice(price, true);
        subsCount += 1;
        emit NewSubscription(id, price);
    }

    function updateSubscription(uint16 id, uint256 price) external onlyOwner isSubExists(id) returns(uint16) {
        uint256 oldPrice = subscriptions[id].price;
        subscriptions[id] = SubPrice(price, true);
        emit UpdateSubscription(id, oldPrice, price);
    }

    function removeSubscription(uint16 id) external onlyOwner isSubExists(id) {
        delete subscriptions[id];
        subsCount -= 1;
        emit RemoveSubscription(id);
    }
    

    function getSubscriptionsCount() public view returns(uint16) {
        return subsCount;
    }

    function getSubscriptionPrice(uint16 id) public view isSubExists(id) returns(uint256) {
        return subscriptions[id].price;
    }
}
