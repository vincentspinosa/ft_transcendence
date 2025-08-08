// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PongTournamentScores {
    address public owner;
    
    struct Player {
        address playerAddress;
        string playerName;
        uint256 score;
        uint256 gamesPlayed;
        uint256 gamesWon;
    }
    
    // Хранение данных игроков по имени игрока (уникальный ключ)
    mapping(string => Player) public playersByName;
    mapping(string => bool) public playerExists;
    string[] public playerNames;
    
    // Также сохраняем связь кошелька с игроками для совместимости
    mapping(address => uint256) public scores;
    mapping(address => string) public addressToPlayerName;
    address[] public players;
    mapping(address => bool) public isPlayer;
    
    // События для отслеживания изменений
    event ScoreUpdated(address indexed walletAddress, string indexed playerName, uint256 score, uint256 gamesPlayed, uint256 gamesWon);
    event PlayerAdded(string indexed playerName, address indexed walletAddress);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }
    
    // Добавление очков игроку (он может выиграть или проиграть) - доступно всем
    function addPlayerScore(string memory playerName, address walletAddress, uint256 scoreToAdd, bool wonGame) public {
        // Если игрок не существует, создаем его
        if (!playerExists[playerName]) {
            playerNames.push(playerName);
            playerExists[playerName] = true;
            playersByName[playerName] = Player({
                playerAddress: walletAddress,
                playerName: playerName,
                score: 0,
                gamesPlayed: 0,
                gamesWon: 0
            });
            emit PlayerAdded(playerName, walletAddress);
        }
        
        // Обновляем статистику игрока
        Player storage player = playersByName[playerName];
        player.score += scoreToAdd;
        player.gamesPlayed += 1;
        if (wonGame) {
            player.gamesWon += 1;
        }
        
        // Обновляем связь с кошельком
        player.playerAddress = walletAddress;
        addressToPlayerName[walletAddress] = playerName;
        
        // Обновляем старые mapping для совместимости
        if (!isPlayer[walletAddress]) {
            players.push(walletAddress);
            isPlayer[walletAddress] = true;
        }
        scores[walletAddress] = player.score;
        
        emit ScoreUpdated(walletAddress, playerName, player.score, player.gamesPlayed, player.gamesWon);
    }

    // Старая функция для совместимости
    function setScore(address player, string memory playerName, uint256 score) public onlyOwner {
        addPlayerScore(playerName, player, score, true);
    }
    
    // Получение данных игрока по имени
    function getPlayerByName(string memory playerName) public view returns (address, string memory, uint256, uint256, uint256) {
        require(playerExists[playerName], "Player does not exist");
        Player memory player = playersByName[playerName];
        return (player.playerAddress, player.playerName, player.score, player.gamesPlayed, player.gamesWon);
    }

    // Получение имени игрока по адресу (для совместимости)
    function getPlayerName(address player) public view returns (string memory) {
        return addressToPlayerName[player];
    }
    
    // Получение счета игрока
    function getScore(address player) public view returns (uint256) {
        return scores[player];
    }
    
    // Получение количества уникальных игроков по именам
    function getUniquePlayersCount() public view returns (uint256) {
        return playerNames.length;
    }

    // Получение имени игрока по индексу
    function getPlayerNameByIndex(uint256 index) public view returns (string memory) {
        require(index < playerNames.length, "Index out of bounds");
        return playerNames[index];
    }

    // Получение количества игроков (старая функция для совместимости)
    function getPlayersCount() public view returns (uint256) {
        return players.length;
    }
    
    // Получение адреса игрока по индексу
    function getPlayer(uint256 index) public view returns (address) {
        require(index < players.length, "Index out of bounds");
        return players[index];
    }
    
    // Получение всех уникальных игроков с полной статистикой
    function getAllUniquePlayersWithStats() public view returns (
        string[] memory names, 
        address[] memory addresses, 
        uint256[] memory totalScores, 
        uint256[] memory gamesPlayedList, 
        uint256[] memory gamesWonList
    ) {
        uint256 count = playerNames.length;
        names = new string[](count);
        addresses = new address[](count);
        totalScores = new uint256[](count);
        gamesPlayedList = new uint256[](count);
        gamesWonList = new uint256[](count);
        
        for (uint i = 0; i < count; i++) {
            string memory playerName = playerNames[i];
            Player memory player = playersByName[playerName];
            names[i] = player.playerName;
            addresses[i] = player.playerAddress;
            totalScores[i] = player.score;
            gamesPlayedList[i] = player.gamesPlayed;
            gamesWonList[i] = player.gamesWon;
        }
        
        return (names, addresses, totalScores, gamesPlayedList, gamesWonList);
    }

    // Старая функция для совместимости
    function getAllPlayers() public view returns (address[] memory, string[] memory, uint256[] memory) {
        uint256[] memory playerScores = new uint256[](players.length);
        string[] memory names = new string[](players.length);
        
        for (uint i = 0; i < players.length; i++) {
            playerScores[i] = scores[players[i]];
            names[i] = addressToPlayerName[players[i]];
        }
        
        return (players, names, playerScores);
    }
    
    // Передача владения контрактом
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
