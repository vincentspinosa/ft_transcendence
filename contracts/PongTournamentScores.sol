// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PongTournamentScores {
    address public owner;
    
    struct Player {
        address playerAddress;
        uint256 score;
    }
    
    // Хранение данных игроков
    mapping(address => uint256) public scores;
    address[] public players;
    mapping(address => bool) public isPlayer;
    
    // События для отслеживания изменений
    event ScoreUpdated(address indexed player, uint256 score);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // Обновление счета игрока
    function setScore(address player, uint256 score) public onlyOwner {
        if (!isPlayer[player]) {
            players.push(player);
            isPlayer[player] = true;
        }
        scores[player] = score;
        emit ScoreUpdated(player, score);
    }
    
    // Получение счета игрока
    function getScore(address player) public view returns (uint256) {
        return scores[player];
    }
    
    // Получение количества игроков
    function getPlayersCount() public view returns (uint256) {
        return players.length;
    }
    
    // Получение адреса игрока по индексу
    function getPlayer(uint256 index) public view returns (address) {
        require(index < players.length, "Index out of bounds");
        return players[index];
    }
    
    // Получение всех игроков и их счетов
    function getAllPlayers() public view returns (address[] memory, uint256[] memory) {
        uint256[] memory playerScores = new uint256[](players.length);
        
        for (uint i = 0; i < players.length; i++) {
            playerScores[i] = scores[players[i]];
        }
        
        return (players, playerScores);
    }
    
    // Передача владения контрактом
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
