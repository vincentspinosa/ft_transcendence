export const PongTournamentScoresABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "score",
                "type": "uint256"
            }
        ],
        "name": "ScoreUpdated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "getAllPlayers",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            },
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getPlayer",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPlayersCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "name": "getScore",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "isPlayer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "players",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "scores",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "score",
                "type": "uint256"
            }
        ],
        "name": "setScore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Байт-код контракта (будет получен после компиляции)
export const PongTournamentScoresBytecode = "0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3610c65806100dc6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80638da5cb5b116100715780638da5cb5b146101805780639363f13a1461019e578063a078f2d1146101ce578063a3f4df7e146101fe578063c41a360a1461021c578063f2fde38b1461024c576100a9565b806313be252b146100ae5780631f7b6d32146100de578063262a9dff146100fc578063524fa7b81461011a5780636f9fb98a14610150575b600080fd5b6100c860048036038101906100c39190610971565b610268565b6040516100d591906109ad565b60405180910390f35b6100e6610288565b6040516100f391906109c8565b60405180910390f35b61010461030f565b60405161011191906109c8565b60405180910390f35b610134600480360381019061012f9190610971565b61031c565b60405161014797969594939291906109e3565b60405180910390f35b610158610477565b604051610169969594939291906109e3565b60405180910390f35b610188610602565b6040516101959190610a71565b60405180910390f35b6101b860048036038101906101b39190610a8c565b610626565b6040516101c59190610a71565b60405180910390f35b6101e860048036038101906101e39190610971565b610663565b6040516101f591906109c8565b60405180910390f35b61020661067b565b60405161021391906109c8565b60405180910390f35b61023660048036038101906102319190610ab9565b6106a2565b6040516102439190610a71565b60405180910390f35b61026660048036038101906102619190610971565b6106e2565b005b60026020528060005260406000206000915054906101000a900460ff1681565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146102e357600080fd5b600360405180602001604052806000815250604051806020016040528060008152506040518060200160405280600081525060405180602001604052806000815250604051806020016040528060008152506040518060200160405280600081525090509091929394959697565b6000600180549050905090565b6000806000806000806000600360008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020548960026000808c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff1688600073ffffffffffffffffffffffffffffffffffffffff168773ffffffffffffffffffffffffffffffffffffffff16149250600073ffffffffffffffffffffffffffffffffffffffff168973ffffffffffffffffffffffffffffffffffffffff1614955084955060019050818180858c5b9a509a509a509a509a509a509a50919395979092949650565b60008060606000606060006000805490506040518060400160405280600081526020016000815250604051806040016040528060008152602001600081525091939598505050505050565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff16149050919050565b60036020528060005260406000206000915090505481565b6040518060400160405280600681526020017f48656c6c6f21000000000000000000000000000000000000000000000000000081525081565b60018181548110156106b257600080fd5b906000526020600020016000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461073a57600080fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561077457600080fd5b8073ffffffffffffffffffffffffffffffffffffffff166000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008135905061084a8161bbfc565b92915050565b600081359050610842816141aa565b92915050565b6000813590506108678161c253565b92915050565b60008060408385031215610880578081fd5b600061088c8582860161083b565b92505060206108908582860161085b565b9150509250929050565b6000602082840312156108ab578081fd5b60006108b984828501610858565b91505092915050565b6000602082840312156108d3578081fd5b60006108e18482850161083b565b91505092915050565b600080604083850312156108fc578182fd5b60006109088582860161083b565b925050602061091a8582860161085b565b9150509250929050565b610935816122a6565b82525050565b610944816142b8565b82525050565b610953816111ed565b82525050565b6109628161109b565b82525050565b610971816161bf565b82525050565b60006020828403121561098257600080fd5b60006109908482850161083b565b91505092915050565b6000602082840312156109aa578081fd5b600082015190508090509291505050565b60006020820190506109cd600083018461094a565b92915050565b60006060820190506109e8600083018461093b565b92915050565b600060808201905061095f6000830189610968565b600060408201905061097b6000830185610959565b60006060820190506109916000830184610959565b60006080820190506109a76000830184610959565b600060a0820190506109bd6000830184610959565b600060c0820190506109d36000830184610959565b6000602082019050610a8a6000830184610968565b92915050565b600060208284031215610a9d578081fd5b6000610aab8482850161085b565b91505092915050565b600060208284031215610aca578081fd5b6000610ad88482850161085b565b91505092915050565b610aea816171b0565b8114610af557600080fd5b50565b610b03816161bf565b8114610b0e57600080fd5b50565b610b1c816131c5565b8114610b2757600080fd5b5056fea2646970667358221220a9571a9517ab6a65d7dbd47e15b57752e5f6c907e3889ecaa4d8e80b95a9ce6164736f6c63430008000033";
