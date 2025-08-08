import { PongTournamentScoresABI, PongTournamentScoresBytecode } from './contractConfig';

export class BlockchainService {
    private contractAddress: string | null = null;
    private connectedAddress: string | null = null;
    private eventListeners: (() => void)[] = [];

    // Проверяет доступность Core.app расширения
    public isCoreAppAvailable(): boolean {
        return typeof window !== 'undefined' && window.avalanche !== undefined;
    }

    // Подключение к кошельку Core.app
    public async connectWallet(): Promise<string | null> {
        if (!this.isCoreAppAvailable()) {
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

        if (!this.isCoreAppAvailable()) {
            throw new Error('Core.app расширение не установлено или не активировано');
        }

        try {
            // Развертывание контракта через Core.app
            const params = {
                from: this.connectedAddress,
                data: PongTournamentScoresBytecode,
                gas: '3000000'
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
        return new Promise((resolve, reject) => {
            const checkReceipt = async () => {
                try {
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
            throw new Error('Адрес контракта не установлен');
        }

        try {
            // Получение количества игроков
            const countData = this.encodeCall('getPlayersCount', [], []);
            const countResult = await window.avalanche.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: countData
                }, 'latest']
            });

            const count = parseInt(countResult, 16);
            const players = [];

            // Получение информации о каждом игроке
            for (let i = 0; i < count; i++) {
                // Получение адреса игрока
                const playerData = this.encodeCall('getPlayer', ['uint256'], [i.toString()]);
                const playerResult = await window.avalanche.request({
                    method: 'eth_call',
                    params: [{
                        to: this.contractAddress,
                        data: playerData
                    }, 'latest']
                });

                const playerAddress = '0x' + playerResult.slice(26);

                // Получение счета игрока
                const scoreData = this.encodeCall('getScore', ['address'], [playerAddress]);
                const scoreResult = await window.avalanche.request({
                    method: 'eth_call',
                    params: [{
                        to: this.contractAddress,
                        data: scoreData
                    }, 'latest']
                });

                const score = parseInt(scoreResult, 16);

                players.push({
                    address: playerAddress,
                    score: score
                });
            }

            return players;
        } catch (error) {
            console.error('Ошибка получения списка игроков:', error);
            throw error;
        }
    }

    // Установка счета игрока (только для владельца контракта)
    public async setPlayerScore(playerAddress: string, score: number): Promise<void> {
        if (!this.contractAddress || !this.connectedAddress) {
            throw new Error('Адрес контракта или подключение кошелька не установлены');
        }

        try {
            // Кодирование вызова функции
            const data = this.encodeCall('setScore', ['address', 'uint256'], [playerAddress, score.toString()]);

            // Отправка транзакции
            const txHash = await window.avalanche.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: this.connectedAddress,
                    to: this.contractAddress,
                    data,
                    gas: '200000'
                }]
            });

            await this.waitForTransaction(txHash);
        } catch (error) {
            console.error('Ошибка установки счета игрока:', error);
            throw error;
        }
    }

    // Подписка на событие обновления счета
    public subscribeToScoreUpdates(callback: (player: string, score: number) => void): void {
        if (!this.contractAddress) {
            throw new Error('Адрес контракта не установлен');
        }

        // Создаем фильтр для события ScoreUpdated
        const filter = {
            address: this.contractAddress,
            topics: ['0x9df7f885bea1d9475c5c33b4f9695e151452bf87c24871d67cbb25a6679f9294']
        };

        const eventListener = async () => {
            try {
                const logs = await window.avalanche.request({
                    method: 'eth_getFilterLogs',
                    params: [filter]
                });

                logs.forEach(log => {
                    // Декодируем данные события
                    const player = '0x' + log.topics[1].slice(26);
                    const score = parseInt(log.data, 16);

                    callback(player, score);
                });
            } catch (error) {
                console.error('Ошибка при получении событий:', error);
            }
        };

        // Запускаем интервал для проверки событий
        const intervalId = setInterval(eventListener, 5000);

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

// Добавляем типы для глобального объекта window
declare global {
    interface Window {
        avalanche: any;
    }
}
