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
        font-size: 10px;
      }
      .stats-table th {
        background-color: #2a2a2a;
        color: #fff;
        padding: 4px;
        text-align: left;
        border: 1px solid #444;
        font-size: 9px;
        font-weight: bold;
      }
      .stats-table td {
        padding: 4px;
        border: 1px solid #ddd;
        background-color: transparent;
        font-size: 9px;
      }
      .stats-table tr:nth-child(even) td {
        background-color: rgba(255, 255, 255, 0.1);
      }
      .stats-table code {
        background-color: rgba(255, 255, 255, 0.2);
        padding: 1px 2px;
        border-radius: 2px;
        font-family: monospace;
        font-size: 8px;
      }
      .stats-table .score {
        font-weight: bold;
        color: #007acc;
        font-size: 10px;
      }
      .stats-summary {
        margin-top: 8px;
        text-align: center;
        opacity: 0.7;
      }
      .stats-summary small {
        font-size: 8px;
      }
      .debug-info {
        opacity: 0.7;
        font-style: italic;
      }
      .no-data-message {
        text-align: center;
        padding: 15px;
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 5px;
        margin: 10px 0;
      }
      .no-data-message .info-text {
        margin-bottom: 10px;
        font-size: 12px;
        color: #ccc;
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

  // Загрузка статистики игроков
  private async loadPlayerStats(): Promise<void> {
    try {
      this.playerListContainer.innerHTML = '<p class="loading">Loading scores...</p>';

      // Проверяем состояние блокчейна
      const contractAddress = this.blockchainService.getContractAddress();
      const connectedAddress = this.blockchainService.getConnectedAddress();

      console.log('📊 Loading player stats...');
      console.log(`Contract: ${contractAddress}`);
      console.log(`Wallet: ${connectedAddress}`);

      if (!contractAddress) {
        this.playerListContainer.innerHTML = '<p class="info-text">Please set contract address first.</p>';
        return;
      }

      if (!connectedAddress) {
        this.playerListContainer.innerHTML = '<p class="info-text">Please connect wallet first.</p>';
        return;
      }

      // Используем новую функцию для получения полной статистики
      console.log('🔄 Fetching players from blockchain...');
      const players = await this.blockchainService.getAllUniquePlayersWithStats();

      console.log(`📈 Received ${players.length} players from blockchain`);
      if (players.length > 0) {
        console.log('📋 Player details:', players.map(p => `${p.name}: ${p.totalScore} pts, ${p.gamesWon}/${p.gamesPlayed} wins`));
      }

      if (players.length === 0) {
        this.playerListContainer.innerHTML = `
          <div class="no-data-message">
            <p class="info-text">No player scores yet.</p>
            <p class="debug-info">
              <small>Contract: ${contractAddress?.substring(0, 10)}...</small><br>
              <small>Wallet: ${connectedAddress?.substring(0, 10)}...</small><br>
              <small>🎮 Play a game to save scores to blockchain!</small><br>
              <small>📊 Scores will appear here automatically after matches.</small>
            </p>
          </div>
        `;
        return;
      }

      // Сортируем игроков по общему счету (убывание)
      players.sort((a, b) => b.totalScore - a.totalScore);

      // Создаем расширенную таблицу с полной статистикой
      let html = `
        <table class="stats-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player Name</th>
              <th>Total Score</th>
              <th>Games</th>
              <th>Wins</th>
              <th>Win Rate</th>
            </tr>
          </thead>
          <tbody>
      `;

      players.forEach((player, index) => {
        const rank = index + 1;
        const playerName = player.name || `Unknown Player (${player.address.substring(0, 6)}...)`;
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

        html += `
          <tr>
            <td><strong>${rankIcon}</strong></td>
            <td><strong>${playerName}</strong></td>
            <td><span class="score">${player.totalScore}</span></td>
            <td>${player.gamesPlayed}</td>
            <td>${player.gamesWon}</td>
            <td>${player.winRate}%</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
        <div class="stats-summary">
          <p><small>Total players: ${players.length} | Last updated: ${new Date().toLocaleTimeString()}</small></p>
        </div>
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
