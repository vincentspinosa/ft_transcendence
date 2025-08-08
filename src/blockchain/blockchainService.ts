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
        this.contractAddress = address;
        // Сохраняем в localStorage для синхронизации между экземплярами
        localStorage.setItem('blockchainContractAddress', address);
    }

    // Получение адреса контракта
    public getContractAddress(): string | null {
        // Сначала проверяем локальное состояние
        if (this.contractAddress) {
            return this.contractAddress;
        }
        // Если нет, проверяем localStorage
        const saved = localStorage.getItem('blockchainContractAddress');
        if (saved) {
            this.contractAddress = saved;
            return saved;
        }
        return null;
    }

    // Генерация детерминированного адреса для игрока на основе его ID
    public generatePlayerAddress(playerId: number): string {
        // Создаем фиктивный адрес на основе ID игрока для демонстрации
        // В реальном приложении каждый игрок должен иметь свой реальный кошелек
        const baseAddress = '0x' + playerId.toString(16).padStart(40, '0');
        return baseAddress;
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

    // Получение всех игроков и их счетов
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
            
            // Диагностика: проверим счет для текущего кошелька
            if (this.connectedAddress) {
                try {
                    const myScore = await this.getPlayerScore(this.connectedAddress);
                    console.log(`🎯 My wallet score: ${this.connectedAddress} = ${myScore}`);
                } catch (scoreError) {
                    console.warn('Could not get my wallet score:', scoreError);
                }
            }

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
                
                // Альтернативная проверка: попробуем проверить текущий кошелек напрямую
                if (this.connectedAddress) {
                    try {
                        console.log('🔄 Trying alternative method: checking current wallet directly');
                        const myScore = await this.getPlayerScore(this.connectedAddress);
                        if (myScore > 0) {
                            console.log('✅ Found score for current wallet, returning that data');
                            return [{
                                address: this.connectedAddress,
                                name: 'Current Player',
                                score: myScore
                            }];
                        }
                    } catch (altError) {
                        console.warn('Alternative method also failed:', altError);
                    }
                }
                
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

    // Установка счета игрока (только для владельца контракта)
    public async setPlayerScore(playerAddress: string, playerName: string, score: number): Promise<void> {
        if (!this.contractAddress || !this.connectedAddress) {
            throw new Error('Contract address or wallet connection not set');
        }

        if (!window.avalanche) {
            throw new Error('Core.app not available');
        }

        try {
            console.log('Setting score for player:', playerAddress, 'name:', playerName, 'score:', score);

            // Сначала попробуем новую версию функции с именем
            await this.setPlayerScoreWithName(playerAddress, playerName, score);

        } catch (error) {
            console.warn('Failed to use new setScore function, trying legacy version:', error);

            try {
                // Fallback к старой версии функции без имени
                await this.setPlayerScoreLegacy(playerAddress, score);
                console.log('✅ Score saved using legacy function');
            } catch (legacyError) {
                console.error('Both setScore functions failed:', legacyError);
                throw legacyError;
            }
        }
    }

    // Новая версия функции setScore с именем игрока
    private async setPlayerScoreWithName(playerAddress: string, playerName: string, score: number): Promise<void> {
        if (!window.avalanche) {
            throw new Error('Core.app not available');
        }

        console.log('Setting score for player:', playerAddress, 'name:', playerName, 'score:', score);

        // Кодирование вызова функции с именем
        const data = this.encodeCall('setScore', ['address', 'string', 'uint256'], [playerAddress, playerName, score.toString()]);

        console.log('Transaction data:', data);

        // Параметры транзакции с увеличенным gas лимитом для строковых операций
        const txParams = {
            from: this.connectedAddress,
            to: this.contractAddress,
            data,
            gas: '0x61A80' // 400000 в hex - увеличенный лимит для строк
        };

        console.log('Transaction params:', txParams);

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
        this.notifyScoreUpdate(playerAddress, score);
    }

    // Старая версия функции setScore без имени игрока (для совместимости)
    private async setPlayerScoreLegacy(playerAddress: string, score: number): Promise<void> {
        if (!window.avalanche) {
            throw new Error('Core.app not available');
        }

        console.log('Setting score for player (legacy):', playerAddress, 'score:', score);

        // Кодирование вызова старой функции без имени
        const data = this.encodeCall('setScore', ['address', 'uint256'], [playerAddress, score.toString()]);

        console.log('Legacy transaction data:', data);

        // Параметры транзакции
        const txParams = {
            from: this.connectedAddress,
            to: this.contractAddress,
            data,
            gas: '0x30D40' // 200000 в hex - меньший лимит для простой операции
        };

        console.log('Legacy transaction params:', txParams);

        // Отправка транзакции
        const txHash = await window.avalanche.request({
            method: 'eth_sendTransaction',
            params: [txParams]
        });

        console.log('Legacy transaction hash:', txHash);

        if (!txHash) {
            throw new Error('No transaction hash received');
        }

        // Ждем подтверждение транзакции
        await this.waitForTransaction(txHash);

        console.log('Legacy transaction confirmed');

        // Даем время блокчейну на обновление состояния
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Уведомляем подписчиков об обновлении счета
        this.notifyScoreUpdate(playerAddress, score);
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

    // Вспомогательный метод для кодирования вызова функции
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


