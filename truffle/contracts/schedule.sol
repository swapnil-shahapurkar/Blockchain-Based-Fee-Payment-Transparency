// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// Import the interfaces
import "./payment.sol";


contract Schedule {
    
    function setContractsAndApplyDiscount(address paymentContractAddress,uint256 amount) public returns (uint256) {
        Payment paymentContract = Payment(paymentContractAddress);
      

        // Apply discount if the amount exceeds the threshold
        uint256 updatedAmount = amount;

        if (amount > 15) {
            updatedAmount = amount - 2;
        }

        // Update linked contracts with the new amount
         paymentContract.updateFee(updatedAmount);
        

        return updatedAmount;
    }
}
