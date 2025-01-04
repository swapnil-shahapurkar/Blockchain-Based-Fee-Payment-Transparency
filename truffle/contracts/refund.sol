// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Refund {
    uint256 public limit=15;

    function updatelimit(uint256 newlimit) public {
        limit = newlimit;
    }

    // Function to validate the payment amount
    function validateAmount(uint256 amount) public view returns (bool) {
        return amount <= limit;
    }
}