// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Penalty {
   
    function applyPenalty(uint256 dueDate, uint256 amount) public view returns (uint256) {
        uint256 currentDate = block.timestamp;

        if (currentDate >= dueDate) {
            return amount + 2;
        }

        return amount; // No penalty if paid on or before the due date
    }
}
