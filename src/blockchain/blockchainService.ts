import { PongTournamentScoresABI, PongTournamentScoresBytecode } from './contractConfig';
import { keccak256 } from 'js-sha3';

export class BlockchainService {
    private contractAddress: string | null = null;
    private connectedAddress: string | null = null;
    private eventListeners: (() => void)[] = [];
    private scoreUpdateCallbacks: ((player: string, score: number) => void)[] = [];

    constructor() {
        // Восстанавливаем состояние из localStorage
        this.contractAddress = localStorage.getItem('blockchainContractAddress');
        this.connectedAddress = localStorage.getItem('blockchainConnectedAddress');
    }

    // Вычисляет хеш топика для события по его сигнатуре
    private getEventTopicHash(eventSignature: string): string {
        // Простая реализация keccak256 для демонстрации
        // В реальном проекте лучше использовать библиотеку вроде ethers.js
        // ScoreUpdated(address,uint256) -> 0x9df7f885bea1d9475c5c33b4f9695e151452bf87c24871d67cbb25a6679f9294
        const knownHashes: { [key: string]: string } = {
            'ScoreUpdated(address,uint256)': '0x9df7f885bea1d9475c5c33b4f9695e151452bf87c24871d67cbb25a6679f9294',
            'OwnershipTransferred(address,address)': '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0'
        };

        if (knownHashes[eventSignature]) {
            return knownHashes[eventSignature];
        }

        console.warn(`Хеш для события ${eventSignature} не найден, используется ScoreUpdated по умолчанию`);
        return knownHashes['ScoreUpdated(address,uint256)'];
    }

    // Проверка доступности Core.app
    private isCoreAppAvailable(): boolean {
        return typeof window !== 'undefined' &&
            typeof window.avalanche !== 'undefined' &&
            window.avalanche !== null;
    }

    // Подключение к кошельку Core.app
    public async connectWallet(): Promise<string | null> {
        if (!this.isCoreAppAvailable() || !window.avalanche) {
            throw new Error('Core.app расширение не установлено или не активировано');
        }

        try {
            // Запрос на подключение к кошельку
            const accounts = await window.avalanche.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
                this.connectedAddress = accounts[0];
                // Сохраняем в localStorage для синхронизации между экземплярами
                localStorage.setItem('blockchainConnectedAddress', accounts[0]);
                return this.connectedAddress;
            }
            return null;
        } catch (error) {
            console.error('Ошибка подключения к кошельку:', error);
            throw error;
        }
    }

    // Получение текущего подключенного адреса
    public getConnectedAddress(): string | null {
        // Сначала проверяем локальное состояние
        if (this.connectedAddress) {
            return this.connectedAddress;
        }
        // Если нет, проверяем localStorage
        const saved = localStorage.getItem('blockchainConnectedAddress');
        if (saved) {
            this.connectedAddress = saved;
            return saved;
        }
        return null;
    }

    // Установка адреса контракта
    public setContractAddress(address: string): void {
        console.log(`🔧 Setting contract address: ${this.contractAddress} -> ${address}`);
        this.contractAddress = address;
        // Сохраняем в localStorage для синхронизации между экземплярами
        localStorage.setItem('blockchainContractAddress', address);
        console.log(`💾 Contract address saved to localStorage: ${address}`);
    }

    // Получение адреса контракта
    public getContractAddress(): string | null {
        // Всегда проверяем localStorage для получения актуального адреса
        const saved = localStorage.getItem('blockchainContractAddress');
        if (saved && saved !== this.contractAddress) {
            console.log(`🔄 Contract address updated from localStorage: ${this.contractAddress} -> ${saved}`);
            this.contractAddress = saved;
        }
        return this.contractAddress;
    }

    // Принудительное обновление адреса контракта из localStorage
    public refreshContractAddress(): string | null {
        const saved = localStorage.getItem('blockchainContractAddress');
        if (saved) {
            this.contractAddress = saved;
            console.log(`♻️ Refreshed contract address: ${saved}`);
        }
        return this.contractAddress;
    }

    // Развертывание нового контракта
    public async deployContract(): Promise<string | null> {
        if (!this.connectedAddress) {
            throw new Error('Сначала подключите кошелек');
        }

        if (!this.isCoreAppAvailable() || !window.avalanche) {
            throw new Error('Core.app расширение не установлено или не активировано');
        }

        try {
            // Проверяем валидность байткода
            if (!PongTournamentScoresBytecode || !PongTournamentScoresBytecode.startsWith('0x')) {
                throw new Error('Некорректный байткод контракта');
            }

            console.log('Развертывание контракта с параметрами:', {
                from: this.connectedAddress,
                dataLength: PongTournamentScoresBytecode.length
            });

            // Развертывание контракта через Core.app
            const params = {
                from: this.connectedAddress,
                data: PongTournamentScoresBytecode,
                gas: '0x1E8480', // 2000000 в hex (уменьшили лимит газа)
                gasPrice: '0x9C4653600', // 42 gwei в hex (уменьшили цену газа для Avalanche)
                value: '0x0' // Нет отправки эфира
            };

            const txHash = await window.avalanche.request({
                method: 'eth_sendTransaction',
                params: [params]
            });

            // Ожидание завершения транзакции и получение адреса контракта
            const receipt = await this.waitForTransaction(txHash);
            if (receipt && receipt.contractAddress) {
                this.setContractAddress(receipt.contractAddress); // Используем setContractAddress для сохранения в localStorage
                return this.contractAddress;
            }
            return null;
        } catch (error) {
            console.error('Ошибка развертывания контракта:', error);
            throw error;
        }
    }

    // Ожидание завершения транзакции
    private async waitForTransaction(txHash: string): Promise<any> {
        if (!window.avalanche) {
            throw new Error('Core.app не доступен');
        }

        return new Promise((resolve, reject) => {
            const checkReceipt = async () => {
                try {
                    if (!window.avalanche) {
                        reject(new Error('Core.app потерян во время ожидания'));
                        return;
                    }

                    const receipt = await window.avalanche.request({
                        method: 'eth_getTransactionReceipt',
                        params: [txHash]
                    });

                    if (receipt) {
                        resolve(receipt);
                    } else {
                        setTimeout(checkReceipt, 2000);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            checkReceipt();
        });
    }

    // Получение счета игрока
    public async getPlayerScore(playerAddress: string): Promise<number> {
        if (!this.contractAddress) {
            throw new Error('Адрес контракта не установлен');
        }

        if (!window.avalanche) {
            throw new Error('Core.app не доступен');
        }

        try {
            // Кодирование вызова функции
            const data = this.encodeCall('getScore', ['address'], [playerAddress]);

            // Вызов контракта
            const result = await window.avalanche.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data
                }, 'latest']
            });

            // Декодирование результата
            return parseInt(result, 16);
        } catch (error) {
            console.error('Ошибка получения счета игрока:', error);
            throw error;
        }
    }

    // Получение имени игрока
    public async getPlayerName(playerAddress: string): Promise<string> {
        if (!this.contractAddress) {
            throw new Error('Адрес контракта не установлен');
        }

        if (!window.avalanche) {
            throw new Error('Core.app не доступен');
        }

        try {
            // Кодирование вызова функции
            const data = this.encodeCall('getPlayerName', ['address'], [playerAddress]);

            // Вызов контракта
            const result = await window.avalanche.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data
                }, 'latest']
            });

            console.log(`getPlayerName(${playerAddress}) raw result:`, result);

            // Декодирование строки из hex
            if (!result || result === '0x' || result.length < 130) {
                console.log(`No valid name data for address ${playerAddress}`);
                return '';
            }

            try {
                // Пропускаем первые 64 символа (32 байта offset) и следующие 64 символа (32 байта length)
                if (result.length < 130) {
                    return '';
                }

                const lengthHex = result.slice(66, 130); // Длина строки
                const length = parseInt(lengthHex, 16);

                if (length === 0) {
                    return '';
                }

                const hexString = result.slice(130, 130 + length * 2); // Данные строки

                // Конвертируем hex в строку
                let name = '';
                for (let i = 0; i < hexString.length; i += 2) {
                    const hex = hexString.substr(i, 2);
                    const charCode = parseInt(hex, 16);
                    if (charCode > 0) {
                        name += String.fromCharCode(charCode);
                    }
                }

                return name.trim();
            } catch (decodeError) {
                console.warn('Error decoding player name:', decodeError);
                return '';
            }
        } catch (error) {
            console.warn('⚠️ Error getting player name (using fallback):', error);
            return ''; // Возвращаем пустую строку вместо выброса ошибки
        }
    }

    // Получение всех уникальных игроков с полной статистикой
    public async getAllUniquePlayersWithStats(): Promise<Array<{
        name: string,
        address: string,
        totalScore: number,
        gamesPlayed: number,
        gamesWon: number,
        winRate: number
    }>> {
        if (!this.contractAddress) {
            console.warn('Contract address not set');
            return [];
        }

        if (!window.avalanche) {
            console.warn('Core.app not available');
            return [];
        }

        try {
            console.log(`🔍 Getting unique players with stats from contract: ${this.contractAddress}`);
            console.log(`📍 Using contract address for READ: ${this.contractAddress}`);

            // Проверяем, есть ли данные в текущем контракте
            console.log(`💡 Checking if contract has player data...`);

            // Сначала попробуем получить количество уникальных игроков
            try {
                const countData = this.encodeCall('getUniquePlayersCount', [], []);
                const countResult = await window.avalanche.request({
                    method: 'eth_call',
                    params: [{
                        to: this.contractAddress,
                        data: countData
                    }, 'latest']
                });
                const uniquePlayerCount = parseInt(countResult, 16);
                console.log(`🎮 Unique players count: ${uniquePlayerCount}`);
            } catch (countError) {
                console.warn('Could not get unique players count:', countError);
            }

            // Вызываем новую функцию для получения полной статистики
            const data = this.encodeCall('getAllUniquePlayersWithStats', [], []);
            const result = await window.avalanche.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: data
                }, 'latest']
            });

            console.log('Raw result from getAllUniquePlayersWithStats:', result);
            console.log('Result length:', result?.length);

            if (!result || result === '0x' || result.length < 130) {
                console.log('⚠️ No valid data returned from contract, trying legacy method');
                console.log('Result details:', { result, length: result?.length });
                // Fallback к старой функции если новая не работает
                return await this.getAllPlayersLegacy();
            }

            // Декодируем результат (5 массивов: names, addresses, scores, gamesPlayed, gamesWon)
            const players = this.decodeMultipleArraysResult(result, 5);

            console.log('Decoded players arrays:', players);
            console.log('Array lengths:', players.map(arr => arr.length));

            if (players.length === 0) {
                console.log('⚠️ No players found in contract');
                return [];
            }

            const [names, addresses, scores, gamesPlayed, gamesWon] = players;
            const playersData = [];

            for (let i = 0; i < names.length; i++) {
                const totalScore = scores[i] || 0;
                const played = gamesPlayed[i] || 0;
                const won = gamesWon[i] || 0;
                const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

                playersData.push({
                    name: names[i] || `Player ${i + 1}`,
                    address: addresses[i] || '0x0000000000000000000000000000000000000000',
                    totalScore: totalScore,
                    gamesPlayed: played,
                    gamesWon: won,
                    winRate: winRate
                });
            }

            console.log(`✅ Found ${playersData.length} unique players with stats`);
            return playersData;

        } catch (error) {
            console.warn('Error getting unique players with stats, falling back to legacy:', error);
            return await this.getAllPlayersLegacy();
        }
    }

    // Fallback к старой функции для совместимости
    private async getAllPlayersLegacy(): Promise<Array<{
        name: string,
        address: string,
        totalScore: number,
        gamesPlayed: number,
        gamesWon: number,
        winRate: number
    }>> {
        try {
            const legacyPlayers = await this.getAllPlayers();
            return legacyPlayers.map(player => ({
                name: player.name,
                address: player.address,
                totalScore: player.score,
                gamesPlayed: 1, // Неизвестно для старых данных
                gamesWon: player.score > 0 ? 1 : 0, // Предполагаем
                winRate: player.score > 0 ? 100 : 0
            }));
        } catch (error) {
            console.warn('Legacy getAllPlayers also failed:', error);
            return [];
        }
    }

    // Старая функция getAllPlayers для совместимости
    public async getAllPlayers(): Promise<Array<{ address: string, name: string, score: number }>> {
        if (!this.contractAddress) {
            console.warn('Contract address not set');
            return [];
        }

        if (!window.avalanche) {
            console.warn('Core.app not available');
            return [];
        }

        try {
            console.log(`🔍 Checking players in contract: ${this.contractAddress}`);

            // Сначала попробуем получить количество игроков
            const countData = this.encodeCall('getPlayersCount', [], []);
            const countResult = await window.avalanche.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: countData
                }, 'latest']
            });

            const playerCount = parseInt(countResult, 16);
            console.log(`📊 Player count from contract ${this.contractAddress}: ${playerCount} (raw: ${countResult})`);

            // Если нет игроков, возвращаем пустой массив
            if (playerCount === 0 || isNaN(playerCount)) {
                console.log('⚠️ No players found in contract or invalid count');
                return [];
            }

            const players = [];

            // Получаем каждого игрока по индексу (максимум 10 для безопасности)
            const maxPlayers = Math.min(playerCount, 10);
            for (let i = 0; i < maxPlayers; i++) {
                try {
                    // Получаем адрес игрока
                    const playerData = this.encodeCall('getPlayer', ['uint256'], [i.toString()]);
                    const playerResult = await window.avalanche.request({
                        method: 'eth_call',
                        params: [{
                            to: this.contractAddress,
                            data: playerData
                        }, 'latest']
                    });

                    console.log(`getPlayer(${i}) raw result:`, playerResult);

                    // Извлекаем адрес из результата
                    // Результат приходит в формате 0x + 64 hex символа (32 байта)
                    // Адрес занимает последние 20 байт (40 hex символов)
                    let playerAddress = '';
                    if (playerResult && playerResult.length >= 42) {
                        // Убираем 0x и берем последние 40 символов, добавляем 0x обратно
                        const hexWithoutPrefix = playerResult.slice(2);
                        const addressHex = hexWithoutPrefix.slice(-40);
                        playerAddress = '0x' + addressHex;
                    } else {
                        console.error('Invalid player result format:', playerResult);
                        continue;
                    }

                    console.log(`Player ${i}: ${playerAddress}`);

                    // Проверяем, что адрес валидный
                    if (playerAddress === '0x0000000000000000000000000000000000000000') {
                        continue;
                    }

                    // Получаем имя и счет игрока
                    const [playerName, score] = await Promise.allSettled([
                        this.getPlayerName(playerAddress),
                        this.getPlayerScore(playerAddress)
                    ]).then(results => [
                        results[0].status === 'fulfilled' ? results[0].value : `Player (${playerAddress.substring(0, 6)}...)`,
                        results[1].status === 'fulfilled' ? results[1].value : 0
                    ]);

                    players.push({
                        address: playerAddress,
                        name: String(playerName || `Player (${playerAddress.substring(0, 6)}...)`),
                        score: Number(score)
                    });
                } catch (playerError) {
                    console.warn(`Error getting player ${i}:`, playerError);
                    // Пропускаем этого игрока и продолжаем
                }
            }

            return players;
        } catch (error) {
            console.warn('Error getting all players, returning empty array:', error);
            // Возвращаем пустой массив вместо выброса ошибки
            return [];
        }
    }

    // Проверка, является ли текущий адрес владельцем контракта
    public async isContractOwner(): Promise<boolean> {
        console.log('🔍 Checking contract ownership...');

        if (!this.contractAddress || !this.connectedAddress) {
            console.log('❌ Missing contract address or connected address');
            console.log(`Contract: ${this.contractAddress}, Wallet: ${this.connectedAddress}`);
            return false;
        }

        if (!window.avalanche) {
            console.log('❌ Core.app not available');
            return false;
        }

        try {
            // Вызываем функцию owner() контракта
            console.log('📞 Calling contract owner() function...');
            const data = this.encodeCall('owner', [], []);
            console.log('📦 Encoded call data:', data);

            const result = await window.avalanche.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: data
                }, 'latest']
            });

            console.log('📄 Raw owner() result:', result);

            // Извлекаем адрес владельца из результата
            const ownerAddress = '0x' + result.slice(-40);
            console.log(`👑 Contract owner: ${ownerAddress}`);
            console.log(`🔗 Connected wallet: ${this.connectedAddress}`);

            const isOwner = ownerAddress.toLowerCase() === this.connectedAddress.toLowerCase();
            console.log(`✅ Ownership check result: ${isOwner}`);

            return isOwner;
        } catch (error) {
            console.error('❌ Error checking contract owner:', error);
            return false;
        }
    }

    // Добавление очков игроку (новая функция)
    public async addPlayerScore(playerName: string, walletAddress: string, scoreToAdd: number, wonGame: boolean): Promise<void> {
        if (!this.contractAddress || !this.connectedAddress) {
            throw new Error('Contract address or wallet connection not set');
        }

        if (!window.avalanche) {
            throw new Error('Core.app not available');
        }

        try {
            console.log(`🎮 Adding score for player: "${playerName}", wallet: ${walletAddress}, score: ${scoreToAdd}, won: ${wonGame}`);

            // Больше не нужна проверка владельца - любой кошелек может сохранять результаты
            console.log(`✅ Proceeding with transaction (no owner verification required)`);

            // Кодирование вызова новой функции addPlayerScore
            const data = this.encodeCall('addPlayerScore',
                ['string', 'address', 'uint256', 'bool'],
                [playerName, walletAddress, scoreToAdd.toString(), wonGame.toString()]);

            console.log('Transaction data:', data);

            // Параметры транзакции с увеличенным gas лимитом и ценой газа
            const txParams = {
                from: this.connectedAddress,
                to: this.contractAddress,
                data,
                gas: '0x7A120', // 500000 в hex - увеличенный лимит для сложных операций
                gasPrice: '0x2540BE400' // 10 Gwei в hex - стандартная цена газа для Avalanche
            };

            console.log('Transaction params:', txParams);
            console.log(`📍 Using contract address for WRITE: ${this.contractAddress}`);

            // Отправка транзакции
            const txHash = await window.avalanche.request({
                method: 'eth_sendTransaction',
                params: [txParams]
            });

            console.log('Transaction hash:', txHash);

            if (!txHash) {
                throw new Error('No transaction hash received');
            }

            // Ждем подтверждение транзакции
            await this.waitForTransaction(txHash);

            console.log('Transaction confirmed');

            // Даем время блокчейну на обновление состояния
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Уведомляем подписчиков об обновлении счета
            this.notifyScoreUpdate(walletAddress, scoreToAdd);
        } catch (error) {
            console.error('Failed to add player score:', error);
            throw error;
        }
    }

    // Установка счета игрока (обновленная функция)
    public async setPlayerScore(playerAddress: string, playerName: string, score: number): Promise<void> {
        // Используем новую функцию addPlayerScore, считая что игрок выиграл если у него есть очки
        await this.addPlayerScore(playerName, playerAddress, score, score > 0);
    }

    // Подписка на обновления счетов
    public onScoreUpdate(callback: (player: string, score: number) => void): void {
        this.scoreUpdateCallbacks.push(callback);
    }

    // Уведомление подписчиков об обновлении счета
    private notifyScoreUpdate(player: string, score: number): void {
        this.scoreUpdateCallbacks.forEach(callback => {
            try {
                callback(player, score);
            } catch (error) {
                console.error('Error in score update callback:', error);
            }
        });
    }

    // Подписка на событие обновления счета
    public subscribeToScoreUpdates(callback: (player: string, score: number) => void): void {
        if (!this.contractAddress) {
            throw new Error('Contract address not set');
        }

        // Простое решение: периодически обновляем данные
        // В реальном проекте лучше использовать WebSocket или правильную подписку на события
        const eventListener = async () => {
            try {
                // Просто вызываем callback для обновления данных
                // callback будет обновлять UI, загружая все данные заново
                console.log('Checking for score updates...');

                // Здесь можно добавить логику проверки изменений
                // Пока что просто информируем о том, что нужно обновить данные
            } catch (error) {
                console.error('Error checking for events:', error);
            }
        };

        // Запускаем интервал для проверки событий каждые 10 секунд
        const intervalId = setInterval(eventListener, 10000);

        // Сохраняем функцию для отписки
        this.eventListeners.push(() => {
            clearInterval(intervalId);
        });
    }

    // Отписка от всех событий
    public unsubscribeFromEvents(): void {
        this.eventListeners.forEach(unsubscribe => unsubscribe());
        this.eventListeners = [];
    }

    // Метод для декодирования результатов с несколькими массивами
    private decodeMultipleArraysResult(result: string, arrayCount: number): any[][] {
        try {
            if (!result || result === '0x' || result.length < 130) {
                return [];
            }

            // Пропускаем первые 2 символа (0x)
            const data = result.slice(2);

            // Читаем offsets для каждого массива
            const offsets = [];
            for (let i = 0; i < arrayCount; i++) {
                const offsetHex = data.slice(i * 64, (i + 1) * 64);
                offsets.push(parseInt(offsetHex, 16) * 2); // Умножаем на 2 для hex
            }

            const arrays = [];

            for (let i = 0; i < arrayCount; i++) {
                const offset = offsets[i];

                // Проверяем границы
                if (offset >= data.length) {
                    console.warn(`Offset ${offset} is out of bounds for data length ${data.length}`);
                    arrays.push([]);
                    continue;
                }

                const lengthHex = data.slice(offset, offset + 64);
                const length = parseInt(lengthHex, 16);

                if (length === 0) {
                    arrays.push([]);
                    continue;
                }

                const arrayData = [];

                if (i === 0) {
                    // Первый массив - массив строк (имена игроков)
                    console.log(`🔤 Decoding ${length} strings from array ${i}`);

                    // Читаем offsets для каждой строки
                    const stringOffsets = [];
                    for (let j = 0; j < length; j++) {
                        const stringOffsetHex = data.slice(offset + 64 + (j * 64), offset + 64 + ((j + 1) * 64));
                        const relativeOffset = parseInt(stringOffsetHex, 16) * 2;
                        stringOffsets.push(relativeOffset);
                        console.log(`String ${j} relative offset: ${relativeOffset}`);
                    }

                    for (let j = 0; j < length; j++) {
                        const stringAbsoluteOffset = offset + stringOffsets[j];
                        console.log(`🔍 Processing string ${j} at absolute offset ${stringAbsoluteOffset}`);

                        if (stringAbsoluteOffset >= data.length) {
                            console.warn(`String offset ${stringAbsoluteOffset} out of bounds`);
                            arrayData.push(`Player ${j + 1}`);
                            continue;
                        }

                        const stringLengthHex = data.slice(stringAbsoluteOffset, stringAbsoluteOffset + 64);
                        const stringLength = parseInt(stringLengthHex, 16);
                        console.log(`String ${j} length: ${stringLength}`);

                        if (stringLength === 0 || stringLength > 100) { // Reduced max length to 100
                            console.warn(`Invalid string length: ${stringLength} for string ${j}`);
                            arrayData.push(`Player ${j + 1}`);
                            continue;
                        }

                        // Получаем hex данные строки
                        const stringDataStartOffset = stringAbsoluteOffset + 64;
                        const stringDataHex = data.slice(stringDataStartOffset, stringDataStartOffset + (stringLength * 2));
                        console.log(`String ${j} hex data (${stringLength} chars): ${stringDataHex}`);

                        // Декодируем hex в UTF-8 строку
                        let stringValue = '';
                        try {
                            for (let k = 0; k < stringLength * 2; k += 2) {
                                const hexByte = stringDataHex.substr(k, 2);
                                if (hexByte && hexByte !== '00') {
                                    const charCode = parseInt(hexByte, 16);
                                    if (charCode >= 32 && charCode <= 126) { // Printable ASCII
                                        stringValue += String.fromCharCode(charCode);
                                    }
                                }
                            }
                        } catch (stringError) {
                            console.warn(`Error decoding string ${j}:`, stringError);
                            stringValue = `Player ${j + 1}`;
                        }

                        // Очищаем строку от мусора
                        stringValue = stringValue.replace(/[^\x20-\x7E]/g, '').trim();
                        console.log(`✅ Decoded string ${j}: "${stringValue}"`);
                        arrayData.push(stringValue || `Player ${j + 1}`);
                    }
                } else {
                    // Остальные массивы - простые типы данных
                    for (let j = 0; j < length; j++) {
                        const itemOffset = offset + 64 + (j * 64);
                        if (itemOffset + 64 > data.length) {
                            arrayData.push(i === 1 ? '0x0000000000000000000000000000000000000000' : 0);
                            continue;
                        }

                        const itemHex = data.slice(itemOffset, itemOffset + 64);

                        if (i === 1) {
                            // Второй массив - адреса
                            const addressHex = itemHex.slice(-40);
                            arrayData.push('0x' + addressHex);
                        } else {
                            // Остальные массивы - числа
                            arrayData.push(parseInt(itemHex, 16) || 0);
                        }
                    }
                }

                arrays.push(arrayData);
            }

            return arrays;
        } catch (error) {
            console.warn('Error decoding multiple arrays result:', error);
            return [];
        }
    }
    private encodeCall(functionName: string, types: string[], values: string[]): string {
        // Создаем сигнатуру функции и вычисляем её Keccak-256 хеш
        const signature = `${functionName}(${types.join(',')})`;
        const hash = keccak256(signature);
        const methodId = '0x' + hash.slice(0, 8); // Первые 4 байта (8 hex символов)

        console.log(`Function: ${signature} -> Method ID: ${methodId}`);

        // Кодируем аргументы
        let encodedParams = '';
        let stringData = '';
        let currentOffset = types.length * 32; // Каждый базовый тип занимает 32 байта

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const type = types[i];

            if (type === 'address') {
                // Удаляем префикс 0x и дополняем до 64 символов
                const paddedValue = value.startsWith('0x') ? value.slice(2) : value;
                encodedParams += paddedValue.toLowerCase().padStart(64, '0');
            } else if (type === 'uint256') {
                // Преобразуем число в hex и дополняем до 64 символов
                const hexValue = parseInt(value).toString(16);
                encodedParams += hexValue.padStart(64, '0');
            } else if (type === 'bool') {
                // Булевое значение: true = 1, false = 0
                const boolValue = (value === 'true' || value === '1') ? '1' : '0';
                encodedParams += boolValue.padStart(64, '0');
            } else if (type === 'string') {
                // Для строки добавляем offset (указатель на позицию строки)
                const offsetHex = currentOffset.toString(16).padStart(64, '0');
                encodedParams += offsetHex;

                // Кодируем строку
                const stringBytes = new TextEncoder().encode(value);
                const lengthHex = stringBytes.length.toString(16).padStart(64, '0');
                const hexString = Array.from(stringBytes)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                // Дополняем строку до кратного 32 байтам
                const paddedStringHex = hexString.padEnd(Math.ceil(hexString.length / 64) * 64, '0');

                stringData += lengthHex + paddedStringHex;
                currentOffset += 32 + Math.ceil(stringBytes.length / 32) * 32; // length + padded data
            }
        }

        // Добавляем строковые данные в конец
        const result = methodId + encodedParams + stringData;
        console.log(`Encoded call: ${result}`);
        return result;
    }
}


