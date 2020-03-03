pragma solidity ^0.6.3;

import "./Subscription.sol";


contract Subscriber {

    modifier onlyOwner() {
        require(msg.sender == owner, "Need owner permission");
        _;
    }

    modifier requireAmount(uint256 amount) {
        require(msg.value >= amount, "Not enought amount");
        _;
    }

    modifier isSubSell(address subAddr, uint16 id) {
        require(subsForSell[subAddr][id].isSell, "Subscription not sell");
        _;
    }

    struct SellingSub {
        uint256 price;
        bool isSell;
    }

    event NewSubscription(
        address indexed subscriptionContractAddress,
        uint16 indexed id
    );

    event newAccountOwner(
        uint256 sellTime
    );

    address private owner;
    uint16 private subsCount;
    uint16 private sellingSubsCount;
    bool private isAccountSell;
    uint256 private accountSellPrice;
    mapping(address => mapping(uint16 => bool)) private subscriptions;
    mapping(address => mapping(uint16 => SellingSub)) private subsForSell;


    constructor() public {
        owner = msg.sender;
        subsCount = 0;
        accountSellPrice = 0;
        isAccountSell = false;
    }

    function buySubscription(address subAddr, uint16 id, uint256 amount) onlyOwner payable external {
        require(!subscriptions[subAddr][id], "Already buyed");
        require(Subscription(subAddr).subscribe.value(amount)(id));
        subscriptions[msg.sender][id] = true;
        subsCount += 1;
        emit NewSubscription(msg.sender, id);
    }

    function sellAccount(uint256 price) external onlyOwner {
        accountSellPrice = price;
        isAccountSell = true;
    }

    function buyAccount() external payable requireAmount(accountSellPrice) {
        require(isAccountSell, "Account not sell");
        address(uint160(owner)).transfer(accountSellPrice);
        owner = msg.sender;
        emit newAccountOwner(now);
    }

    function abortSellAccount() external onlyOwner {
        accountSellPrice = 0;
        isAccountSell = false;
    }

    function sellSubscription(address subAddr, uint16 id, uint256 price) external onlyOwner{
        subsForSell[subAddr][id] = SellingSub(price, true);
        sellingSubsCount += 1;
    }

    function abortSellSubscription(address subAddr, uint16 id)
    external onlyOwner isSubSell(subAddr, id) {

        delete subsForSell[subAddr][id];
        sellingSubsCount -= 1;
    }

    function buySubscriptionFromMe(address subAddr, uint16 id)
    external payable requireAmount(subsForSell[subAddr][id].price) isSubSell(subAddr, id) returns(bool) {

        delete subsForSell[subAddr][id];
        delete subscriptions[subAddr][id];
        sellingSubsCount -= 1;
        subsCount -= 1;
        return true;
    }

    function buySubscriptionFromContract(address selllerContract,
      address subAddr,
      uint16 id,
      uint256 amount) external payable onlyOwner {
        
        require(!subscriptions[subAddr][id], "Already buyed");
        require(Subscriber(selllerContract).buySubscriptionFromMe.value(amount)(subAddr, id));
        subscriptions[subAddr][id] = true;
        subsCount += 1;
    }


    function getSubscriptionsCount() external view returns(uint16)  {
        return subsCount;
    }

    function isSubscriptionBuy(address subAddr, uint16 id) external view returns(bool)  {
        return subscriptions[subAddr][id];
    }

    function getAccountSellPrice() external view returns(uint256)  {
        return accountSellPrice;
    }

    function getIsAccountSell() external view returns(bool)  {
        return isAccountSell;
    }

    function getSubscriptionForSellPrice(address subAddr, uint16 id)
    external view isSubSell(subAddr, id) returns(uint256) {

        return subsForSell[subAddr][id].price;
    }

    function getSubscriptionsForSellCount() external view returns(uint16)  {
        return sellingSubsCount;
    }
}
