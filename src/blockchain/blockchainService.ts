import { PongTournamentScoresABI, PongTournamentScoresBytecode } from './contractConfig';

export class BlockchainService {
    private contractAddress: string | null = null;
    private connectedAddress: string | null = null;
    private eventListeners: (() => void)[] = [];

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
        return this.connectedAddress;
    }

    // Установка адреса контракта
    public setContractAddress(address: string): void {
        this.contractAddress = address;
    }

    // Получение адреса контракта
    public getContractAddress(): string | null {
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
                gas: '0x2DC6C0', // 3000000 в hex
                gasPrice: '0x174876E800', // 100 gwei в hex
                value: '0x0' // Нет отправки эфира
            };

            const txHash = await window.avalanche.request({
                method: 'eth_sendTransaction',
                params: [params]
            });

            // Ожидание завершения транзакции и получение адреса контракта
            const receipt = await this.waitForTransaction(txHash);
            if (receipt && receipt.contractAddress) {
                this.contractAddress = receipt.contractAddress;
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

    // Получение всех игроков и их счетов
    public async getAllPlayers(): Promise<Array<{ address: string, score: number }>> {
        if (!this.contractAddress) {
            console.warn('Contract address not set');
            return [];
        }

        if (!window.avalanche) {
            console.warn('Core.app not available');
            return [];
        }

        try {
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
            console.log('Player count:', playerCount);

            // Если нет игроков, возвращаем пустой массив
            if (playerCount === 0 || isNaN(playerCount)) {
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

                    // Извлекаем адрес из результата (последние 20 байт)
                    const playerAddress = '0x' + playerResult.slice(-40);

                    // Проверяем, что адрес валидный
                    if (playerAddress === '0x0000000000000000000000000000000000000000') {
                        continue;
                    }

                    // Получаем счет игрока
                    const score = await this.getPlayerScore(playerAddress);

                    players.push({
                        address: playerAddress,
                        score: score
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
    public async setPlayerScore(playerAddress: string, score: number): Promise<void> {
        if (!this.contractAddress || !this.connectedAddress) {
            throw new Error('Contract address or wallet connection not set');
        }

        if (!window.avalanche) {
            throw new Error('Core.app not available');
        }

        try {
            console.log('Setting score for player:', playerAddress, 'score:', score);

            // Кодирование вызова функции
            const data = this.encodeCall('setScore', ['address', 'uint256'], [playerAddress, score.toString()]);

            console.log('Transaction data:', data);

            // Упрощенные параметры транзакции
            const txParams = {
                from: this.connectedAddress,
                to: this.contractAddress,
                data,
                gas: '0x30D40' // 200000 в hex
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
        } catch (error) {
            console.error('Error setting player score:', error);
            throw error;
        }
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
        // Находим функцию в ABI
        const functionABI = PongTournamentScoresABI.find(
            item => item.type === 'function' && item.name === functionName
        );

        if (!functionABI) {
            throw new Error(`Функция ${functionName} не найдена в ABI`);
        }

        // Создаем сигнатуру функции
        const signature = `${functionName}(${types.join(',')})`;
        const signatureHash = this.sha3(signature).slice(0, 10);

        // Кодируем аргументы
        let encodedParams = '';
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            const type = types[i];

            if (type === 'address') {
                // Удаляем префикс 0x и дополняем до 64 символов
                const paddedValue = value.startsWith('0x') ? value.slice(2) : value;
                encodedParams += paddedValue.padStart(64, '0');
            } else if (type === 'uint256') {
                // Преобразуем число в hex и дополняем до 64 символов
                const hexValue = parseInt(value).toString(16);
                encodedParams += hexValue.padStart(64, '0');
            }
        }

        return signatureHash + encodedParams;
    }

    // Реализация sha3 (Keccak-256)
    private sha3(input: string): string {
        // Упрощенная версия для примера, в реальном коде нужно использовать библиотеку
        // Например keccak256 из ethers.js или web3.js
        // Возвращаем заглушку для упрощения примера
        const mockHash = '0x' + Array(64).fill('0').join('');
        return mockHash;
    }
}


