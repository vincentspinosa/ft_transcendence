import { BlockchainService } from '../_blockchainService';
import { getErrorMessage } from '../errorUtils';

export class BlockchainScoreBoard {
  private container: HTMLElement;
  private blockchainService: BlockchainService;
  private refreshInterval: number | null = null;
  private connectButton!: HTMLButtonElement;
  private connectionStatus!: HTMLSpanElement;
  private contractAddressInput!: HTMLInputElement;
  private deployContractButton!: HTMLButtonElement;
  private checkContractButton!: HTMLButtonElement;
  private playerListContainer!: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container with ID ${containerId} not found`);

    this.container = container;
    this.blockchainService = new BlockchainService();

    this.createUI();
    this.initEventListeners();
    this.setupBlockchainEvents();
    this.loadSavedContract();
    this.startAutoRefresh();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div class="p-4">
        <h2 class="text-white text-lg font-bold mb-4">Blockchain Scores</h2>
        <div class="mb-4">
          <button id="connect-btn" class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded mb-2">Connect Wallet</button>
          <div class="text-center">
            <span id="status" class="text-white text-sm">Disconnected</span>
          </div>
        </div>
        <div class="mb-4">
          <div class="flex gap-2 mb-2">
            <button id="deploy-btn" class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded" disabled>Deploy Contract</button>
            <button id="check-btn" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm rounded" disabled>Check Contract</button>
          </div>
          <input type="text" id="contract-input" class="w-full px-3 py-2 bg-transparent border border-gray-400 text-white text-sm placeholder-gray-400 rounded" placeholder="Contract address (optional)">
        </div>
        <div id="players"><p class="text-white text-sm">Connect wallet to view scores</p></div>
      </div>
    `;
    this.connectButton = this.container.querySelector('#connect-btn') as HTMLButtonElement;
    this.connectionStatus = this.container.querySelector('#status') as HTMLSpanElement;
    this.contractAddressInput = this.container.querySelector('#contract-input') as HTMLInputElement;
    this.deployContractButton = this.container.querySelector('#deploy-btn') as HTMLButtonElement;
    this.checkContractButton = this.container.querySelector('#check-btn') as HTMLButtonElement;
    this.playerListContainer = this.container.querySelector('#players') as HTMLElement;
  }

  private initEventListeners(): void {
    this.connectButton.addEventListener('click', async () => {
      try {
        const address = await this.blockchainService.connectWallet();
        if (address) {
          await this.updateStatus();
          this.deployContractButton.disabled = false;
          if (this.blockchainService.getContractAddress()) this.loadStats();
        }
      } catch (error) {
        alert(`Connection failed: ${getErrorMessage(error)}`);
      }
    });

    this.contractAddressInput.addEventListener('blur', () => {
      const address = this.contractAddressInput.value.trim();
      if (address?.startsWith('0x')) {
        this.blockchainService.setContractAddress(address);
        localStorage.setItem('blockchainContractAddress', address);
        this.checkContractButton.disabled = false;
        this.loadStats();
      } else {
        this.checkContractButton.disabled = true;
      }
    });

    this.deployContractButton.addEventListener('click', async () => {
      try {
        this.deployContractButton.disabled = true;
        this.deployContractButton.textContent = 'Deploying...';

        const address = await this.blockchainService.deployContract();
        if (address) {
          this.contractAddressInput.value = address;
          localStorage.setItem('blockchainContractAddress', address);
          this.checkContractButton.disabled = false;
          this.loadStats();
        }
      } catch (error) {
        alert(`Deployment failed: ${getErrorMessage(error)}`);
      } finally {
        this.deployContractButton.disabled = false;
        this.deployContractButton.textContent = 'Deploy Contract';
      }
    });

    this.checkContractButton.addEventListener('click', () => {
      const address = this.contractAddressInput.value.trim();
      if (address?.startsWith('0x')) {
        const url = `https://testnet.snowtrace.io/address/${address}`;
        window.open(url, '_blank');
      }
    });
  }

  private setupBlockchainEvents(): void {
    this.blockchainService.onNetworkChange(() => {
      this.updateStatus();
      this.loadStats();
    });

    this.blockchainService.onAccountChange((accounts: string[]) => {
      this.updateStatus();
      if (accounts.length > 0) {
        this.loadStats();
      } else {
        // Пользователь отключился - показываем сообщение
        this.playerListContainer.innerHTML = '<p class="text-white text-sm">Connect wallet to view scores</p>';
      }
    });

    this.blockchainService.onScoreUpdate(() => this.loadStats());
  }

  private loadSavedContract(): void {
    const address = this.blockchainService.getContractAddress();
    if (address) {
      this.contractAddressInput.value = address;
      this.checkContractButton.disabled = false;
      setTimeout(() => {
        this.updateStatus();
        this.loadStats();
      }, 1000);
    }
  }

  private startAutoRefresh(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = window.setInterval(() => this.loadStats(), 10000);
    setTimeout(() => this.updateStatus(), 500);
  }

  private async updateStatus(): Promise<void> {
    try {
      const isConnected = await this.blockchainService.isWalletActuallyConnected();
      const address = this.blockchainService.getConnectedAddress();

      if (isConnected && address) {
        const network = await this.blockchainService.getCurrentNetwork();
        this.connectionStatus.textContent = `${address.substring(0, 6)}...${address.slice(-3)} (${network.name})`;
        this.connectionStatus.className = 'text-green-400 text-sm font-medium';
        this.connectButton.style.display = 'none';
      } else {
        this.connectionStatus.textContent = 'Disconnected';
        this.connectionStatus.className = 'text-white text-sm';
        this.connectButton.style.display = 'block';
      }
    } catch (error) {
      this.connectionStatus.textContent = 'Error';
      this.connectionStatus.className = 'text-red-400 text-sm';
      this.connectButton.style.display = 'block';
    }
  }

  private async loadStats(): Promise<void> {
    try {
      const contract = this.blockchainService.getContractAddress();
      const isConnected = await this.blockchainService.isWalletActuallyConnected();

      if (!contract) {
        this.playerListContainer.innerHTML = '<p class="text-white text-sm">Please set contract address first.</p>';
        return;
      }

      if (!isConnected) {
        this.playerListContainer.innerHTML = '<p class="text-white text-sm">Please connect wallet first.</p>';
        return;
      }

      const players = await this.blockchainService.getAllUniquePlayersWithStats();

      if (players.length === 0) {
        this.playerListContainer.innerHTML = `
          <div class="text-center p-4 border border-gray-600 rounded mt-2">
            <p class="text-white text-sm">No scores yet.</p>
          </div>
        `;
        return;
      }

      players.sort((a, b) => b.totalScore - a.totalScore);

      const html = `
        <table class="w-full border-collapse mt-2 text-xs">
          <thead>
            <tr>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 font-bold">Login</th>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 font-bold">Score</th>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 font-bold">Games</th>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 font-bold">Wins</th>
            </tr>
          </thead>
          <tbody>
            ${players.map((player, i) => `
              <tr class="${i % 2 === 1 ? 'bg-white bg-opacity-10' : ''}">
                <td class="p-1 border border-gray-600 text-white font-bold">${player.name || `(${player.address.substring(0, 6)}...)`}</td>
                <td class="p-1 border border-gray-600 text-blue-400 font-bold">${player.totalScore}</td>
                <td class="p-1 border border-gray-600 text-white">${player.gamesPlayed}</td>
                <td class="p-1 border border-gray-600 text-white">${player.gamesWon}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      this.playerListContainer.innerHTML = html;
    } catch (error) {
      this.playerListContainer.innerHTML = `<p class="text-red-400 text-sm">Error: ${getErrorMessage(error)}</p>`;
    }
  }

  public destroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.blockchainService.unsubscribeFromEvents();
  }
}
