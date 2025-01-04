// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Payment {
    uint256 public Fee=10;

    function updateFee(uint256 newFee) public {
        Fee = newFee;
    }

    // Function to validate the payment amount
    function validateAmount(uint256 amount) public view returns (bool) {
        return amount >= Fee;
    }
}
