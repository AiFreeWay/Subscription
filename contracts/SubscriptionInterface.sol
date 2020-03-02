pragma solidity ^0.6.3;

interface SubscriptionInterface {
    function buy(uint16 subscriptionType) external payable;
}
