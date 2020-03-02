pragma solidity ^0.6.3;

interface SubscriberInterface {
    function confirmSubscription(uint16 subscriptionType) external;
}
