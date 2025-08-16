import { BlockchainService } from '../blockchainService';
import { getErrorMessage } from '../errorUtils';

export class BlockchainScoreBoard {
  private container: HTMLElement;
  private blockchainService: BlockchainService;
  private refreshInterval: number | null = null;

  // DOM elements
  private connectButton!: HTMLButtonElement;
  private connectionStatus!: HTMLSpanElement;
  private contractAddressInput!: HTMLInputElement;
  private applyContractButton!: HTMLButtonElement;
  private deployContractButton!: HTMLButtonElement;
  private playerListContainer!: HTMLElement;

  constructor(containerId: string) {
    // Get container for UI placement
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }

    this.container = container;
    this.blockchainService = new BlockchainService();

    // Create UI elements
    this.createUI();

    // Initialize event handlers
    this.initEventListeners();

    // Check for saved contract address
    this.loadSavedContractAddress();

    // Setup network and account change listeners
    this.setupBlockchainEventListeners();

    // Check actual wallet connection state on initialization
    this.initializeConnectionState();

    // Start automatic statistics refresh every 5 seconds
    this.startAutoRefresh();
  }

  // Setup blockchain event listeners
  private setupBlockchainEventListeners(): void {
    // Listen for network changes
    this.blockchainService.onNetworkChange((chainId: string, networkName: string) => {
      console.log(`🔄 Network changed: ${networkName} (${chainId})`);
      this.updateConnectionStatus();
      this.loadPlayerStats(); // Reload data for new network
    });

    // Listen for account changes
    this.blockchainService.onAccountChange((accounts: string[]) => {
      console.log('👤 Account changed:', accounts);
      this.updateConnectionStatus();
      if (accounts.length === 0) {
        // User disconnected
        this.showDisconnectedState();
      } else {
        // User switched account or reconnected
        this.loadPlayerStats();
      }
    });
  }

  /**
   * Initialize connection state by checking actual MetaMask connection
   */
  private async initializeConnectionState(): Promise<void> {
    try {
      // Wait a bit for MetaMask to load
      setTimeout(async () => {
        console.log('🔄 Checking initial wallet connection state...');

        // Check if wallet is actually connected
        const isConnected = await this.blockchainService.isWalletActuallyConnected();
        console.log(`Initial wallet state: ${isConnected ? 'Connected' : 'Disconnected'}`);

        // Update UI based on actual state
        await this.updateConnectionStatus();

        // Load stats if everything is ready
        if (isConnected && this.blockchainService.getContractAddress()) {
          this.loadPlayerStats();
        }
      }, 1500); // Wait for blockchain service to initialize
    } catch (error) {
      console.warn('Error checking initial connection state:', error);
    }
  }

  // Show disconnected state
  private showDisconnectedState(): void {
    this.playerListContainer.innerHTML = `
      <p class="text-white text-sm">Wallet disconnected. Please connect to view blockchain scores.</p>
    `;
  }

  // Start automatic statistics refresh
  private startAutoRefresh(): void {
    // Clear previous interval if exists
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Subscribe to score update events
    this.blockchainService.onScoreUpdate((player: string, score: number) => {
      console.log(`Score update received: ${player} = ${score}`);
      // Update statistics immediately after receiving event
      this.checkAndLoadStats();
    });

    // Update every 10 seconds (increased interval since we have events)
    this.refreshInterval = window.setInterval(async () => {
      await this.checkAndLoadStats();
    }, 10000);
  }

  /**
   * Check connection and load stats if everything is ready
   */
  private async checkAndLoadStats(): Promise<void> {
    try {
      const hasContract = this.blockchainService.getContractAddress();
      const isConnected = await this.blockchainService.isWalletActuallyConnected();

      if (hasContract && isConnected) {
        this.loadPlayerStats();
      }
    } catch (error) {
      console.warn('Error checking connection for stats update:', error);
    }
  }

  // Create UI components
  private createUI(): void {
    this.container.innerHTML = `
      <div class="p-4">
        <h2 class="text-white text-lg font-bold mb-4">Blockchain Scores with MetaMask (Avalanche Network)</h2>
        
        <div class="mb-4 flex items-center gap-3">
          <button id="connect-wallet-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded">Connect Wallet</button>
          <span id="connection-status" class="text-white text-sm">Disconnected</span>
        </div>
        
        <div class="mb-4">
          <p class="text-white text-sm mb-2">Use a previously created contract or&nbsp;create a&nbsp;new one for saving a score</p>
          <div class="flex gap-2">
            <input type="text" id="contract-address-input" class="flex-1 px-3 py-2 bg-transparent border border-gray-400 text-white text-sm placeholder-gray-400 rounded" placeholder="Contract address (optional)">
            <button id="deploy-contract-btn" class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-medium rounded" disabled>Deploy new contract</button>
          </div>
        </div>
        
        <div>
          <div id="player-list-container">
            <p class="text-white text-sm">Connect wallet to view blockchain scores</p>
          </div>
        </div>
      </div>
    `;

    // Get references to created elements
    this.connectButton = this.container.querySelector('#connect-wallet-btn') as HTMLButtonElement;
    this.connectionStatus = this.container.querySelector('#connection-status') as HTMLSpanElement;
    this.contractAddressInput = this.container.querySelector('#contract-address-input') as HTMLInputElement;
    this.deployContractButton = this.container.querySelector('#deploy-contract-btn') as HTMLButtonElement;
    this.playerListContainer = this.container.querySelector('#player-list-container') as HTMLElement;

    this.applyContractButton = this.deployContractButton; // For compatibility

    // Add enhanced styles for table
    this.addTableStyles();
  }

  // Add styles for improved table display with Tailwind-only approach
  private addTableStyles(): void {
    // No additional CSS needed - using Tailwind classes only
  }

  // Initialize event handlers
  private initEventListeners(): void {
    // Wallet connection button handler
    this.connectButton.addEventListener('click', async () => {
      try {
        const address = await this.blockchainService.connectWallet();
        if (address) {
          // Update connection status with proper verification
          await this.updateConnectionStatus();
          this.deployContractButton.disabled = false;

          // If contract address already exists, load data
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

    // Automatic contract address application on input
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

    // Contract deployment button handler
    this.deployContractButton.addEventListener('click', async () => {
      try {
        this.deployContractButton.disabled = true;
        this.deployContractButton.textContent = 'Deploying...';

        const contractAddress = await this.blockchainService.deployContract();
        if (contractAddress) {
          this.contractAddressInput.value = contractAddress;
          this.saveContractAddress(contractAddress);

          // Load data from new contract
          this.loadPlayerStats();

          // Subscribe to score update events
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

  // Update connection status
  // Update connection status dynamically
  private async updateConnectionStatus(): Promise<void> {
    try {
      // Use the new verified connection check
      const isActuallyConnected = await this.blockchainService.isWalletActuallyConnected();
      const connectedAddress = this.blockchainService.getConnectedAddress();

      if (isActuallyConnected && connectedAddress) {
        const currentNetwork = await this.blockchainService.getCurrentNetwork();
        this.connectionStatus.textContent = `${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 3)} (${currentNetwork.name})`;
        this.connectionStatus.className = 'text-green-400 text-sm font-medium';
      } else {
        this.connectionStatus.textContent = 'Disconnected';
        this.connectionStatus.className = 'text-white text-sm';

        // If MetaMask is available but not connected, show connect button
        const connectButton = this.container.querySelector('#connect-wallet-btn') as HTMLButtonElement;
        if (connectButton) {
          connectButton.style.display = 'inline-block';
          connectButton.textContent = 'Connect Wallet';
        }
      }
    } catch (error) {
      console.error('Failed to update connection status:', error);
      this.connectionStatus.textContent = 'Connection Error';
      this.connectionStatus.className = 'text-red-400 text-sm';
    }
  }

  // Update connection status with specific address (original method)
  private updateConnectionStatusWithAddress(address: string): void {
    this.connectionStatus.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 3)}`;
    this.connectionStatus.className = 'text-green-400 text-sm font-medium';
  }

  // Load player statistics
  private async loadPlayerStats(): Promise<void> {
    try {
      // Check blockchain state with real verification
      const contractAddress = this.blockchainService.getContractAddress();
      const isWalletConnected = await this.blockchainService.isWalletActuallyConnected();
      const connectedAddress = this.blockchainService.getConnectedAddress();

      console.log('Loading player stats...');
      console.log(`Contract: ${contractAddress}`);
      console.log(`Wallet connected: ${isWalletConnected}`);
      console.log(`Wallet address: ${connectedAddress}`);

      if (!contractAddress) {
        this.playerListContainer.innerHTML = '<p class="text-white text-sm">Please set contract address first.</p>';
        return;
      }

      if (!isWalletConnected) {
        this.playerListContainer.innerHTML = '<p class="text-white text-sm">Please connect your wallet first.</p>';
        return;
      }

      if (!connectedAddress) {
        this.playerListContainer.innerHTML = '<p class="text-white text-sm">Please connect wallet first.</p>';
        return;
      }

      // Use new function to get full statistics
      // console.log('🔄 Fetching players from blockchain...');
      const players = await this.blockchainService.getAllUniquePlayersWithStats();

      console.log(`📈 Received ${players.length} players from blockchain`);
      if (players.length > 0) {
        console.log('📋 Player details:', players.map(p => `${p.name}: ${p.totalScore} pts, ${p.gamesWon}/${p.gamesPlayed} wins`));
      }

      if (players.length === 0) {
        this.playerListContainer.innerHTML = `
          <div class="text-center p-4 border border-gray-600 rounded mt-2">
            <p class="text-white text-sm mb-2">No player scores yet.</p>
            <p class="text-gray-400 text-xs italic">
              <small>Contract: ${contractAddress?.substring(0, 10)}...</small><br>
              <small>Wallet: ${connectedAddress?.substring(0, 10)}...</small><br>
            </p>
          </div>
        `;
        return;
      }

      // Sort players by total score (descending)
      players.sort((a, b) => b.totalScore - a.totalScore);

      // Create enhanced table with full statistics
      let html = `
        <table class="w-full border-collapse mt-2 text-xs">
          <thead>
            <tr>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 text-xs font-bold">Login</th>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 text-xs font-bold">Score</th>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 text-xs font-bold">Games</th>
              <th class="bg-gray-800 text-white p-1 text-left border border-gray-600 text-xs font-bold">Wins</th>
            </tr>
          </thead>
          <tbody>
      `;

      players.forEach((player, index) => {
        const playerName = player.name || `(${player.address.substring(0, 6)}...)`;

        html += `
          <tr class="${index % 2 === 1 ? 'bg-white bg-opacity-10' : ''}">
            <td class="p-1 border border-gray-600 text-white font-bold text-xs">${playerName}</td>
            <td class="p-1 border border-gray-600 text-blue-400 font-bold text-xs">${player.totalScore}</td>
            <td class="p-1 border border-gray-600 text-white text-xs">${player.gamesPlayed}</td>
            <td class="p-1 border border-gray-600 text-white text-xs">${player.gamesWon}</td>
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
      this.playerListContainer.innerHTML = `<p class="text-red-400 text-sm">Error loading data: ${getErrorMessage(error)}</p>`;
    }
  }

  // Subscribe to score update events
  private subscribeToScoreUpdates(): void {
    // First unsubscribe from previous subscriptions
    this.blockchainService.unsubscribeFromEvents();

    // Subscribe to score updates
    this.blockchainService.subscribeToScoreUpdates((player, score) => {
      console.log(`Player ${player} score updated: ${score}`);
      this.loadPlayerStats();
    });

    // Periodic data updates
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = window.setInterval(() => {
      this.loadPlayerStats();
    }, 30000);
  }

  // Save contract address to localStorage
  private saveContractAddress(address: string): void {
    // Use the same key as BlockchainService to avoid conflicts
    localStorage.setItem('blockchainContractAddress', address);
  }

  // Load contract address from localStorage
  private async loadSavedContractAddress(): Promise<void> {
    const savedAddress = this.blockchainService.getContractAddress();
    if (savedAddress) {
      this.contractAddressInput.value = savedAddress;
      console.log(`♻️ Restored contract address: ${savedAddress}`);

      // If wallet is connected, load data and update status
      if (this.blockchainService.getConnectedAddress()) {
        await this.updateConnectionStatus(); // Update status with current network
        this.loadPlayerStats();
        this.subscribeToScoreUpdates();
      }
    }
  }

  // Method for cleaning up resources when removing component
  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.blockchainService.unsubscribeFromEvents();
  }
}
