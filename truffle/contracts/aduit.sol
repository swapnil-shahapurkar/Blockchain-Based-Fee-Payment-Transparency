// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Audit {
    // Mapping to store transaction hashes against transaction IDs
    mapping(string => string) public transactions;

    // Function to log a transaction
    function logTransaction(string memory transactionId, string memory hash) public {
                // Store the transaction hash
        transactions[transactionId] = hash;
    }

    // Function to audit a transaction
    function auditTransaction(string memory transactionId, string memory hash) public view returns (bool) {
  
        // Compare the provided hash with the stored hash
        return keccak256(abi.encodePacked(transactions[transactionId])) == keccak256(abi.encodePacked(hash));
    }
}
