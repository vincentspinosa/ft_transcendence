import { WalletManager } from './modules/WalletManager';
import { NetworkManager } from './modules/NetworkManager';
import { ContractManager } from './modules/ContractManager';
import { PlayerDataManager, PlayerStats } from './modules/PlayerDataManager';
import { EventManager } from './modules/EventManager';

export class BlockchainService {
    private walletManager: WalletManager;
    private networkManager: NetworkManager;
    private contractManager: ContractManager;
    private playerDataManager: PlayerDataManager;
    private eventManager: EventManager;

    constructor() {
        // Initialize all modules
        this.walletManager = new WalletManager();
        this.networkManager = new NetworkManager();
        this.contractManager = new ContractManager(this.walletManager);
        this.playerDataManager = new PlayerDataManager(this.contractManager, this.networkManager);
        this.eventManager = new EventManager();
    }

    // === Wallet Management Methods ===

    /**
     * Check if wallet is actually connected
     */
    public async isWalletActuallyConnected(): Promise<boolean> {
        return this.walletManager.isWalletActuallyConnected();
    }

    /**
     * Connect to MetaMask wallet
     */
    public async connectWallet(): Promise<string | null> {
        const result = await this.walletManager.connectWallet();
        
        // Check and switch network if needed after connecting
        if (result) {
            const currentChainId = await window.ethereum?.request({
                method: 'eth_chainId'
            });

            const supportedNetworks = ['0xa86a', '0xa869']; // Mainnet and Fuji Testnet

            if (!supportedNetworks.includes(currentChainId)) {
                console.log(`Not on Avalanche network (${currentChainId}), switching...`);
                await this.networkManager.ensureCorrectNetwork();
            } else {
                console.log(`Already on supported Avalanche network: ${currentChainId}`);
            }
        }

        return result;
    }

    /**
     * Get connected wallet address
     */
    public getConnectedAddress(): string | null {
        return this.walletManager.getConnectedAddress();
    }

    /**
     * Get connected address with real-time verification
     */
    public async getConnectedAddressVerified(): Promise<string | null> {
        return this.walletManager.getConnectedAddressVerified();
    }

    // === Network Management Methods ===

    /**
     * Get current network information
     */
    public async getCurrentNetwork(): Promise<{ chainId: string, name: string }> {
        return this.networkManager.getCurrentNetwork();
    }

    /**
     * Subscribe to network changes
     */
    public onNetworkChange(callback: (chainId: string, networkName: string) => void): void {
        this.networkManager.onNetworkChange(callback);
    }

    /**
     * Subscribe to account changes
     */
    public onAccountChange(callback: (accounts: string[]) => void): void {
        this.walletManager.onAccountChange(callback);
    }

    // === Contract Management Methods ===

    /**
     * Set contract address
     */
    public setContractAddress(address: string): void {
        this.contractManager.setContractAddress(address);
    }

    /**
     * Get contract address
     */
    public getContractAddress(): string | null {
        return this.contractManager.getContractAddress();
    }

    /**
     * Deploy new contract
     */
    public async deployContract(): Promise<string | null> {
        return this.contractManager.deployContract();
    }

    // === Player Data Methods ===

    /**
     * Get player score by address
     */
    public async getPlayerScore(playerAddress: string): Promise<number> {
        return this.playerDataManager.getPlayerScore(playerAddress);
    }

    /**
     * Get player name by address
     */
    public async getPlayerName(playerAddress: string): Promise<string> {
        return this.playerDataManager.getPlayerName(playerAddress);
    }

    /**
     * Get all unique players with full statistics
     */
    public async getAllUniquePlayersWithStats(): Promise<PlayerStats[]> {
        return this.playerDataManager.getAllUniquePlayersWithStats();
    }

    /**
     * Legacy getAllPlayers function for compatibility
     */
    public async getAllPlayers(): Promise<Array<{ address: string, name: string, score: number }>> {
        return this.playerDataManager.getAllPlayers();
    }

    /**
     * Add player score and game result
     */
    public async addPlayerScore(playerName: string, walletAddress: string, scoreToAdd: number, wonGame: boolean): Promise<void> {
        await this.playerDataManager.addPlayerScore(playerName, walletAddress, scoreToAdd, wonGame);
        
        // Notify subscribers of score update
        this.eventManager.notifyScoreUpdate(walletAddress, scoreToAdd);
    }

    // === Event Management Methods ===

    /**
     * Subscribe to score updates
     */
    public onScoreUpdate(callback: (player: string, score: number) => void): void {
        this.eventManager.onScoreUpdate(callback);
    }

    /**
     * Subscribe to score update events
     */
    public subscribeToScoreUpdates(callback: (player: string, score: number) => void): void {
        const contractAddress = this.contractManager.getContractAddress();
        this.eventManager.subscribeToScoreUpdates(callback, contractAddress);
    }

    /**
     * Unsubscribe from all events
     */
    public unsubscribeFromEvents(): void {
        this.eventManager.unsubscribeFromEvents();
    }
}
