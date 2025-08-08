import { BlockchainService } from '../blockchain/blockchainService';
import { getErrorMessage } from '../utils/errorUtils';

export class BlockchainScoreBoard {
  private container: HTMLElement;
  private blockchainService: BlockchainService;
  private refreshInterval: number | null = null;

  // DOM элементы
  private connectButton!: HTMLButtonElement;
  private connectionStatus!: HTMLSpanElement;
  private contractAddressInput!: HTMLInputElement;
  private applyContractButton!: HTMLButtonElement;
  private deployContractButton!: HTMLButtonElement;
  private playerListContainer!: HTMLElement; constructor(containerId: string) {
    // Получаем контейнер для размещения UI
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Контейнер с ID ${containerId} не найден`);
    }

    this.container = container;
    this.blockchainService = new BlockchainService();

    // Создаем UI элементы
    this.createUI();

    // Инициализируем обработчики событий
    this.initEventListeners();

    // Проверяем наличие сохраненного адреса контракта
    this.loadSavedContractAddress();

    // Запускаем автоматическое обновление статистики каждые 5 секунд
    this.startAutoRefresh();
  }

  // Запуск автоматического обновления статистики
  private startAutoRefresh(): void {
    // Очищаем предыдущий интервал если он был
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Подписываемся на события обновления счетов
    this.blockchainService.onScoreUpdate((player: string, score: number) => {
      console.log(`Score update received: ${player} = ${score}`);
      // Обновляем статистику сразу после получения события
      if (this.blockchainService.getContractAddress() && this.blockchainService.getConnectedAddress()) {
        this.loadPlayerStats();
      }
    });

    // Обновляем каждые 10 секунд (увеличили интервал, т.к. есть события)
    this.refreshInterval = window.setInterval(() => {
      if (this.blockchainService.getContractAddress() && this.blockchainService.getConnectedAddress()) {
        this.loadPlayerStats();
      }
    }, 10000);
  }  // Создание UI компонентов
  private createUI(): void {
    this.container.innerHTML = `
      <div class="blockchain-scoreboard">
        <h2>Blockchain Scores</h2>
        
        <div class="wallet-section">
          <button id="connect-wallet-btn" class="btn-primary">Connect Wallet</button>
          <span id="connection-status" class="status">Disconnected</span>
        </div>
        
        <div class="contract-section">
          <input type="text" id="contract-address-input" class="input" placeholder="Contract address (optional)">
          <button id="deploy-contract-btn" class="btn-secondary" disabled>Deploy Contract</button>
        </div>
        
        <div class="stats-section">
          <div id="player-list-container" class="stats-container">
            <p class="info-text">Connect wallet to view blockchain scores</p>
          </div>
        </div>
      </div>
    `;

    // Получаем ссылки на созданные элементы
    this.connectButton = this.container.querySelector('#connect-wallet-btn') as HTMLButtonElement;
    this.connectionStatus = this.container.querySelector('#connection-status') as HTMLSpanElement;
    this.contractAddressInput = this.container.querySelector('#contract-address-input') as HTMLInputElement;
    this.deployContractButton = this.container.querySelector('#deploy-contract-btn') as HTMLButtonElement;
    this.playerListContainer = this.container.querySelector('#player-list-container') as HTMLElement;

    // Убираем отдельный apply button - будем использовать автоматическое применение
    this.applyContractButton = this.deployContractButton; // Для совместимости

    // Добавляем улучшенные стили для таблицы
    this.addTableStyles();
  }

  // Добавление стилей для улучшенного отображения таблицы
  private addTableStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .stats-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 11px;
      }
      .stats-table th {
        background-color: #2a2a2a;
        color: #fff;
        padding: 6px;
        text-align: left;
        border: 1px solid #444;
        font-size: 10px;
      }
      .stats-table td {
        padding: 6px;
        border: 1px solid #ddd;
        background-color: #f9f9f9;
      }
      .stats-table tr:nth-child(even) td {
        background-color: #f0f0f0;
      }
      .stats-table code {
        background-color: #e8e8e8;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 10px;
      }
      .stats-table .score {
        font-weight: bold;
        color: #007acc;
        font-size: 12px;
      }
    `;
    this.container.appendChild(style);
  }

  // Инициализация обработчиков событий
  private initEventListeners(): void {
    // Обработчик кнопки подключения кошелька
    this.connectButton.addEventListener('click', async () => {
      try {
        const address = await this.blockchainService.connectWallet();
        if (address) {
          this.updateConnectionStatus(address);
          this.deployContractButton.disabled = false;

          // Если уже есть адрес контракта, загружаем данные
          const contractAddress = this.blockchainService.getContractAddress();
          if (contractAddress) {
            this.loadPlayerStats();
          }
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        alert(`Wallet connection failed: ${getErrorMessage(error)}`);
      }
    });

    // Автоматическое применение адреса контракта при вводе
    this.contractAddressInput.addEventListener('blur', () => {
      const address = this.contractAddressInput.value.trim();
      if (address && address.startsWith('0x')) {
        try {
          this.blockchainService.setContractAddress(address);
          this.saveContractAddress(address);
          this.loadPlayerStats();
          this.subscribeToScoreUpdates();
        } catch (error) {
          console.error('Contract address error:', error);
        }
      }
    });

    // Обработчик кнопки развертывания контракта
    this.deployContractButton.addEventListener('click', async () => {
      try {
        this.deployContractButton.disabled = true;
        this.deployContractButton.textContent = 'Deploying...';

        const contractAddress = await this.blockchainService.deployContract();
        if (contractAddress) {
          this.contractAddressInput.value = contractAddress;
          this.saveContractAddress(contractAddress);

          // Загружаем данные из нового контракта
          this.loadPlayerStats();

          // Подписываемся на события обновления счета
          this.subscribeToScoreUpdates();

          alert(`Contract deployed at: ${contractAddress}`);
        }
      } catch (error) {
        console.error('Contract deployment error:', error);
        alert(`Contract deployment failed: ${getErrorMessage(error)}`);
      } finally {
        this.deployContractButton.disabled = false;
        this.deployContractButton.textContent = 'Deploy Contract';
      }
    });
  }

  // Обновление статуса подключения
  private updateConnectionStatus(address: string): void {
    this.connectionStatus.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    this.connectionStatus.classList.add('connected');
  }

  // Получение имени игрока по блокчейн адресу
  private getPlayerNameByAddress(address: string): string {
    // Сначала проверяем сохраненные имена игроков
    const savedNames = this.getSavedPlayerNames();
    if (savedNames[address]) {
      return savedNames[address];
    }

    // Маппинг блокчейн адресов к именам игроков по умолчанию (на основе player ID)
    const addressToName: { [key: string]: string } = {
      '0x0000000000000000000000000000000000000001': 'Player 1',
      '0x0000000000000000000000000000000000000002': 'Player 2', 
      '0x0000000000000000000000000000000000000003': 'Player 3',
      '0x0000000000000000000000000000000000000004': 'Player 4'
    };

    return addressToName[address] || `Unknown Player (${address.substring(0, 6)}...)`;
  }

  // Получение сохраненных имен игроков из localStorage
  private getSavedPlayerNames(): { [address: string]: string } {
    try {
      const saved = localStorage.getItem('tournamentPlayerNames');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Error loading player names from localStorage:', error);
      return {};
    }
  }

  // Сохранение имен игроков в localStorage
  public static savePlayerNames(playerConfigs: Array<{name: string, blockchainAddress: string}>): void {
    try {
      const nameMapping: { [address: string]: string } = {};
      playerConfigs.forEach(player => {
        if (player.blockchainAddress) {
          nameMapping[player.blockchainAddress] = player.name;
        }
      });
      localStorage.setItem('tournamentPlayerNames', JSON.stringify(nameMapping));
      console.log('Player names saved:', nameMapping);
    } catch (error) {
      console.warn('Error saving player names to localStorage:', error);
    }
  }

  // Загрузка статистики игроков
  private async loadPlayerStats(): Promise<void> {
    try {
      this.playerListContainer.innerHTML = '<p class="loading">Loading scores...</p>';

      const players = await this.blockchainService.getAllPlayers();

      if (players.length === 0) {
        this.playerListContainer.innerHTML = '<p class="info-text">No player scores yet.</p>';
        return;
      }

      // Создаем расширенную таблицу с данными игроков
      let html = `
        <table class="stats-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Address</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
      `;

      players.forEach((player) => {
        const playerName = this.getPlayerNameByAddress(player.address);
        html += `
          <tr>
            <td><strong>${playerName}</strong></td>
            <td><code>${player.address.substring(0, 6)}...${player.address.substring(player.address.length - 4)}</code></td>
            <td><span class="score">${player.score}</span></td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      this.playerListContainer.innerHTML = html;
    } catch (error) {
      console.error('Error loading player stats:', error);
      this.playerListContainer.innerHTML = `<p class="error">Error loading data: ${getErrorMessage(error)}</p>`;
    }
  }

  // Подписка на события обновления счета
  private subscribeToScoreUpdates(): void {
    // Сначала отписываемся от предыдущих подписок
    this.blockchainService.unsubscribeFromEvents();

    // Подписываемся на обновления счета
    this.blockchainService.subscribeToScoreUpdates((player, score) => {
      console.log(`Player ${player} score updated: ${score}`);
      this.loadPlayerStats();
    });

    // Настраиваем периодическое обновление данных
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = window.setInterval(() => {
      this.loadPlayerStats();
    }, 30000); // Обновляем каждые 30 секунд
  }

  // Сохранение адреса контракта в localStorage
  private saveContractAddress(address: string): void {
    localStorage.setItem('pongContractAddress', address);
  }

  // Загрузка адреса контракта из localStorage
  private loadSavedContractAddress(): void {
    const savedAddress = localStorage.getItem('pongContractAddress');
    if (savedAddress) {
      this.contractAddressInput.value = savedAddress;
      this.blockchainService.setContractAddress(savedAddress);

      // Если есть подключение к кошельку, загружаем данные
      if (this.blockchainService.getConnectedAddress()) {
        this.loadPlayerStats();
        this.subscribeToScoreUpdates();
      }
    }
  }

  // Добавление стилей
  private addStyles(): void {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .blockchain-scoreboard {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .blockchain-scoreboard h2 {
        color: #333;
        margin-bottom: 20px;
      }
      
      .connection-section, .contract-section {
        margin-bottom: 20px;
      }
      
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      
      .btn-primary {
        background-color: #007bff;
        color: white;
      }
      
      .btn-secondary {
        background-color: #6c757d;
        color: white;
      }
      
      .btn-success {
        background-color: #28a745;
        color: white;
      }
      
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .status {
        margin-left: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: #dc3545;
        color: white;
      }
      
      .status.connected {
        background-color: #28a745;
      }
      
      .input-group {
        display: flex;
        margin-bottom: 10px;
      }
      
      .form-control {
        flex: 1;
        padding: 8px;
        border: 1px solid #ced4da;
        border-radius: 4px 0 0 4px;
      }
      
      .input-group .btn {
        border-radius: 0 4px 4px 0;
      }
      
      .player-list {
        margin-top: 10px;
      }
      
      .player-stats-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      
      .player-stats-table th, .player-stats-table td {
        border: 1px solid #dee2e6;
        padding: 8px;
        text-align: left;
      }
      
      .player-stats-table th {
        background-color: #e9ecef;
      }
      
      .player-stats-table tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      
      .error {
        color: #dc3545;
      }
    `;

    document.head.appendChild(styleElement);
  }

  // Метод для очистки ресурсов при удалении компонента
  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.blockchainService.unsubscribeFromEvents();
  }
}
