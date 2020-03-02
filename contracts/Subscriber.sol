pragma solidity ^0.6.3;

import "./SubscriberInterface.sol";
import "./SubscriptionInterface.sol";


contract Subscriber is SubscriberInterface {

    modifier onlyOwner() {
        require(msg.sender == owner, "Need owner permission");
        _;
    }

    event NewSubscription(
        address indexed subscriptionContract,
        uint16 indexed id
    );

    event newAccountOwner(
        uint256 sellTime
    );

    enum SubscriptionState {
        NotBuy,
        WaitForConfirmation,
        Buyed
    }

    address private owner;
    mapping(address => mapping(uint16 => SubscriptionState)) private subscriptions;
    uint16 private subscriptionsCount;
    uint256 private accountSellPrice;
    bool private isAccountSell;

    constructor() public {
        owner = msg.sender;
        subscriptionsCount = 0;
        accountSellPrice = 0;
        isAccountSell = false;
    }

    function buySubscription(address subscriptionContract, uint16 id, uint256 amount) onlyOwner payable external {
        require(subscriptions[subscriptionContract][id] != SubscriptionState.Buyed, "Already buyed");
        subscriptions[subscriptionContract][id] = SubscriptionState.WaitForConfirmation;
        SubscriptionInterface(subscriptionContract).buy.value(amount)(id);
    }

    function sellAccount(uint256 price) external onlyOwner {
        accountSellPrice = price;
        isAccountSell = true;
    }

    function buyAccount() external payable {
        require(isAccountSell, "Account not sell");
        require(msg.value >= accountSellPrice, "Not enought money");
        address(uint160(owner)).transfer(accountSellPrice);
        owner = msg.sender;
        emit newAccountOwner(now);
    }

    function abortSellAccount() external onlyOwner {
        accountSellPrice = 0;
        isAccountSell = false;
    }

    function confirmSubscription(uint16 id) external override {
        require(subscriptions[msg.sender][id] == SubscriptionState.WaitForConfirmation, "Not wait for buy");
        subscriptions[msg.sender][id] != SubscriptionState.Buyed;
        subscriptionsCount += 1;
        emit NewSubscription(msg.sender, id);
    }

    function getSubscriptionsCount() external view returns(uint16)  {
        return subscriptionsCount;
    }

    function getSubscriptionsState(address subscriptionContract, uint16 id) external view returns(Subscriber.SubscriptionState)  {
        return subscriptions[subscriptionContract][id];
    }

    function getAccountSellPrice() external view returns(uint256)  {
        return accountSellPrice;
    }

    function getIsAccountSell() external view returns(bool)  {
        return isAccountSell;
    }
}