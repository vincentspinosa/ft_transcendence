import { PongTournamentScoresBytecode, PongTournamentScoresABI } from './contractConfig';
import { ethers } from 'ethers';

export class BlockchainService {
    private contractAddress: string | null = null;
    private connectedAddress: string | null = null;
    private eventListeners: (() => void)[] = [];
    private scoreUpdateCallbacks: ((player: string, score: number) => void)[] = [];
    private networkChangeCallbacks: ((chainId: string, networkName: string) => void)[] = [];
    private accountChangeCallbacks: ((accounts: string[]) => void)[] = [];
    private provider: ethers.BrowserProvider | null = null;
    private contract: ethers.Contract | null = null;

    constructor() {
        // Restore state from localStorage
        this.contractAddress = localStorage.getItem('blockchainContractAddress');
        this.connectedAddress = localStorage.getItem('blockchainConnectedAddress');

        // Setup event listeners for MetaMask changes
        this.setupMetaMaskEventListeners();

        // Verify wallet connection state on initialization
        this.initializeWalletState();
    }

    /**
     * Initialize wallet state by checking actual MetaMask connection
     */
    private async initializeWalletState(): Promise<void> {
        try {
            // Wait a bit for MetaMask to load
            setTimeout(async () => {
                await this.isWalletActuallyConnected();
                console.log('🔗 Wallet state initialized:', {
                    isAvailable: this.isMetaMaskAvailable(),
                    connectedAddress: this.connectedAddress
                });
            }, 1000);
        } catch (error) {
            console.warn('Error initializing wallet state:', error);
        }
    }

    // Setup MetaMask event listeners for network and account changes
    private setupMetaMaskEventListeners(): void {
        if (!window.ethereum || !window.ethereum.on) return;

        // Listen for network changes
        const handleChainChanged = (chainId: string) => {
            console.log('Network changed to:', chainId);
            const networkNames = {
                '0xa86a': 'Avalanche C-Chain (Mainnet)',
                '0xa869': 'Avalanche Fuji Testnet',
            };

            const networkName = networkNames[chainId as keyof typeof networkNames] || `Unknown Network (${chainId})`;
            console.log(`Current network: ${networkName}`);

            // Notify all subscribers about network change
            this.networkChangeCallbacks.forEach(callback => {
                try {
                    callback(chainId, networkName);
                } catch (error) {
                    console.error('Error in network change callback:', error);
                }
            });
        };

        // Listen for account changes
        const handleAccountsChanged = (accounts: string[]) => {
            console.log('Accounts changed:', accounts);

            if (accounts.length === 0) {
                // User disconnected
                console.log('User disconnected wallet');
                this.connectedAddress = null;
                localStorage.removeItem('blockchainConnectedAddress');
            } else if (accounts[0] !== this.connectedAddress) {
                // User switched account
                console.log('User switched account from', this.connectedAddress, 'to', accounts[0]);
                this.connectedAddress = accounts[0];
                localStorage.setItem('blockchainConnectedAddress', accounts[0]);
            }

            // Notify all subscribers about account change
            this.accountChangeCallbacks.forEach(callback => {
                try {
                    callback(accounts);
                } catch (error) {
                    console.error('Error in account change callback:', error);
                }
            });
        };

        // Register event listeners
        window.ethereum.on('chainChanged', handleChainChanged);
        window.ethereum.on('accountsChanged', handleAccountsChanged);

        // Store cleanup functions
        this.eventListeners.push(() => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('chainChanged', handleChainChanged);
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        });
    }

    private async getProvider(): Promise<ethers.BrowserProvider> {
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        if (!this.provider) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
        }
        return this.provider;
    }

    private async getContract(): Promise<ethers.Contract> {
        if (!this.contractAddress) {
            throw new Error('Contract address not set');
        }

        if (!this.contract || this.contract.target !== this.contractAddress) {
            const provider = await this.getProvider();
            const signer = await provider.getSigner();
            this.contract = new ethers.Contract(this.contractAddress, PongTournamentScoresABI, signer);
        }
        return this.contract;
    }

    // Check MetaMask availability
    private isMetaMaskAvailable(): boolean {
        return typeof window !== 'undefined' &&
            typeof window.ethereum !== 'undefined' &&
            window.ethereum !== null &&
            window.ethereum.isMetaMask === true;
    }

    /**
     * Check if MetaMask is available and wallet is actually connected
     * This is more reliable than just checking localStorage
     */
    public async isWalletActuallyConnected(): Promise<boolean> {
        if (!this.isMetaMaskAvailable() || !window.ethereum) {
            return false;
        }

        try {
            // Check if there are any connected accounts without requesting permission
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const hasConnectedAccounts = accounts && accounts.length > 0;

            // Update our local state based on actual MetaMask state
            if (hasConnectedAccounts) {
                const currentAccount = accounts[0];
                // Update local state if it's different
                if (this.connectedAddress !== currentAccount) {
                    this.connectedAddress = currentAccount;
                    localStorage.setItem('blockchainConnectedAddress', currentAccount);
                }
            } else {
                // Clear local state if no accounts are connected in MetaMask
                this.connectedAddress = null;
                localStorage.removeItem('blockchainConnectedAddress');
            }

            return hasConnectedAccounts;
        } catch (error) {
            console.warn('Error checking wallet connection:', error);
            // Clear local state on error
            this.connectedAddress = null;
            localStorage.removeItem('blockchainConnectedAddress');
            return false;
        }
    }

    // Connect to MetaMask wallet
    public async connectWallet(): Promise<string | null> {
        if (!this.isMetaMaskAvailable() || !window.ethereum) {
            throw new Error('MetaMask extension not installed or activated');
        }

        try {
            // Request wallet connection
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
                this.connectedAddress = accounts[0];
                // Save to localStorage for cross-instance sync
                localStorage.setItem('blockchainConnectedAddress', accounts[0]);

                // Check if we're already on a supported Avalanche network
                const currentChainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });

                const supportedNetworks = ['0xa86a', '0xa869']; // Mainnet and Fuji Testnet

                if (!supportedNetworks.includes(currentChainId)) {
                    console.log(`Not on Avalanche network (${currentChainId}), switching...`);
                    await this.switchToAvalancheNetwork();
                } else {
                    console.log(`Already on supported Avalanche network: ${currentChainId}`);
                }

                return this.connectedAddress;
            }
            return null;
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    // Switch to Avalanche C-Chain (with Fuji Testnet support)
    private async switchToAvalancheNetwork(): Promise<void> {
        if (!window.ethereum) return;

        try {
            // First, check current network
            const currentChainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            console.log('Current chain ID:', currentChainId);

            // If already on Avalanche Mainnet or Fuji Testnet, don't switch
            if (currentChainId === '0xa86a' || currentChainId === '0xa869') {
                console.log('Already on supported Avalanche network');
                return;
            }

            // Try to switch to Avalanche C-Chain Mainnet by default
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xa86a' }], // Avalanche C-Chain Mainnet
            });

            console.log('Successfully switched to Avalanche C-Chain');
        } catch (switchError: any) {
            console.log('Switch error:', switchError);

            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    console.log('Adding Avalanche networks to MetaMask...');

                    // Add Avalanche C-Chain Mainnet
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0xa86a',
                            chainName: 'Avalanche C-Chain',
                            nativeCurrency: {
                                name: 'AVAX',
                                symbol: 'AVAX',
                                decimals: 18,
                            },
                            rpcUrls: [
                                'https://api.avax.network/ext/bc/C/rpc',
                                'https://rpc.ankr.com/avalanche',
                                'https://avalanche-c-chain.publicnode.com'
                            ],
                            blockExplorerUrls: ['https://snowtrace.io/'],
                        }],
                    });

                    console.log('Successfully added Avalanche C-Chain to MetaMask');
                } catch (addError) {
                    console.error('Failed to add Avalanche network:', addError);
                    throw new Error('Failed to add Avalanche network to MetaMask. Please add it manually.');
                }
            } else {
                console.error('Failed to switch to Avalanche network:', switchError);
                throw new Error('Failed to switch to Avalanche network. Please switch manually in MetaMask.');
            }
        }
    }

    // Check if we're on a supported Avalanche network
    private async ensureCorrectNetwork(): Promise<void> {
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        try {
            const currentChainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            // Support both Avalanche Mainnet and Fuji Testnet
            const supportedNetworks = {
                '0xa86a': 'Avalanche C-Chain (Mainnet)',
                '0xa869': 'Avalanche Fuji Testnet'
            };

            console.log(`Current network: ${currentChainId}`);

            if (supportedNetworks[currentChainId as keyof typeof supportedNetworks]) {
                console.log(`Connected to ${supportedNetworks[currentChainId as keyof typeof supportedNetworks]}`);
                return; // Already on a supported network
            }

            console.warn(`Unsupported network detected: ${currentChainId}`);
            console.log('Supported networks:', Object.entries(supportedNetworks).map(([id, name]) => `${id} (${name})`).join(', '));

            // Ask user which network they prefer or default to mainnet
            console.log('Switching to Avalanche Mainnet by default...');
            await this.switchToAvalancheNetwork();

            // Verify the switch was successful
            const newChainId = await window.ethereum.request({
                method: 'eth_chainId'
            });

            if (!supportedNetworks[newChainId as keyof typeof supportedNetworks]) {
                throw new Error(`Failed to switch to supported Avalanche network. Current: ${newChainId}`);
            }

            console.log(`Successfully switched to ${supportedNetworks[newChainId as keyof typeof supportedNetworks]}`);
        } catch (error) {
            console.error('Network check failed:', error);
            throw error;
        }
    }

    // Public method to check current network
    public async getCurrentNetwork(): Promise<{ chainId: string, name: string }> {
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        const currentChainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        const networkNames = {
            '0xa86a': 'Avalanche C-Chain (Mainnet)',
            '0xa869': 'Avalanche Fuji Testnet',
        };

        return {
            chainId: currentChainId,
            name: networkNames[currentChainId as keyof typeof networkNames] || `Unknown Network (${currentChainId})`
        };
    }

    // Subscribe to network changes
    public onNetworkChange(callback: (chainId: string, networkName: string) => void): void {
        this.networkChangeCallbacks.push(callback);
    }

    // Subscribe to account changes
    public onAccountChange(callback: (accounts: string[]) => void): void {
        this.accountChangeCallbacks.push(callback);
    }

    // Get current connected wallet address
    public getConnectedAddress(): string | null {
        // Return local state (this should be kept in sync by isWalletActuallyConnected)
        return this.connectedAddress;
    }

    /**
     * Get connected address with real-time verification
     * Use this when you need to be sure the wallet is actually connected
     */
    public async getConnectedAddressVerified(): Promise<string | null> {
        const isConnected = await this.isWalletActuallyConnected();
        return isConnected ? this.connectedAddress : null;
    }

    // Set contract address
    public setContractAddress(address: string): void {
        // console.log(`🔧 Setting contract address: ${this.contractAddress} -> ${address}`);
        this.contractAddress = address;
        // Save to localStorage for persistence
        localStorage.setItem('blockchainContractAddress', address);
        // console.log(`Contract address saved to localStorage: ${address}`);
    }

    // Get contract address
    public getContractAddress(): string | null {
        // Always check localStorage for latest address
        const saved = localStorage.getItem('blockchainContractAddress');
        if (saved && saved !== this.contractAddress) {
            // console.log(`Contract address updated from localStorage: ${this.contractAddress} -> ${saved}`);
            this.contractAddress = saved;
        }
        return this.contractAddress;
    }

    public async deployContract(): Promise<string | null> {
        if (!this.connectedAddress) {
            throw new Error('Please connect wallet first');
        }

        if (!this.isMetaMaskAvailable() || !window.ethereum) {
            throw new Error('MetaMask extension not available');
        }

        try {
            console.log('Deploying contract...');

            const provider = await this.getProvider();
            const signer = await provider.getSigner();

            // Create contract factory with ethers
            const contractFactory = new ethers.ContractFactory(
                PongTournamentScoresABI,
                PongTournamentScoresBytecode,
                signer
            );

            // Deploy with existing gas parameters
            const contract = await contractFactory.deploy({
                gasLimit: 0x1E8480, // 2M gas limit (same as before)
                gasPrice: 0x9C4653600, // 42 gwei for Avalanche (same as before)
            });

            // Wait for deployment
            await contract.waitForDeployment();
            const contractAddress = await contract.getAddress();

            this.setContractAddress(contractAddress);
            return contractAddress;
        } catch (error) {
            console.error('Contract deployment failed:', error);
            throw error;
        }
    }

    public async getPlayerScore(playerAddress: string): Promise<number> {
        await this.ensureCorrectNetwork();

        try {
            const contract = await this.getContract();
            const score = await contract.getScore(playerAddress);
            return Number(score);
        } catch (error) {
            console.error('Error getting player score:', error);
            return 0;
        }
    }

    public async getPlayerName(playerAddress: string): Promise<string> {
        try {
            const contract = await this.getContract();
            const name = await contract.getPlayerName(playerAddress);
            return name || '';
        } catch (error) {
            console.warn('⚠️ Error getting player name (using fallback):', error);
            return '';
        }
    }

    public async getAllUniquePlayersWithStats(): Promise<Array<{
        name: string,
        address: string,
        totalScore: number,
        gamesPlayed: number,
        gamesWon: number,
        winRate: number
    }>> {
        try {
            await this.ensureCorrectNetwork();
            const contract = await this.getContract();

            const [names, addresses, scores, gamesPlayed, gamesWon] = await contract.getAllUniquePlayersWithStats();

            const playersData = [];
            for (let i = 0; i < names.length; i++) {
                const totalScore = Number(scores[i]) || 0;
                const played = Number(gamesPlayed[i]) || 0;
                const won = Number(gamesWon[i]) || 0;

                playersData.push({
                    name: names[i] || 'Unknown Player',
                    address: addresses[i] || '',
                    totalScore,
                    gamesPlayed: played,
                    gamesWon: won,
                    winRate: played > 0 ? Math.round((won / played) * 100) : 0
                });
            }

            console.log(`✅ Found ${playersData.length} unique players with stats`);
            return playersData;
        } catch (error) {
            console.warn('Error getting unique players with stats, falling back to legacy:', error);
            return await this.getAllPlayersLegacy();
        }
    }

    // Fallback to legacy function for compatibility
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
                gamesPlayed: 1, // Unknown for legacy data
                gamesWon: player.score > 0 ? 1 : 0, // Assumed
                winRate: player.score > 0 ? 100 : 0
            }));
        } catch (error) {
            console.warn('Legacy getAllPlayers also failed:', error);
            return [];
        }
    }

    // Legacy getAllPlayers function for compatibility
    public async getAllPlayers(): Promise<Array<{ address: string, name: string, score: number }>> {
        if (!this.contractAddress) {
            console.warn('Contract address not set');
            return [];
        }

        if (!window.ethereum) {
            console.warn('MetaMask not available');
            return [];
        }

        try {
            // console.log(`🔍 Checking players in contract: ${this.contractAddress}`);

            // First try to get player count
            const countData = this.encodeCall('getPlayersCount', [], []);
            const countResult = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: countData
                }, 'latest']
            });

            const playerCount = parseInt(countResult, 16);
            console.log(`📊 Player count from contract ${this.contractAddress}: ${playerCount} (raw: ${countResult})`);

            // If no players, return empty array
            if (playerCount === 0 || isNaN(playerCount)) {
                console.log('⚠️ No players found in contract or invalid count');
                return [];
            }

            const players = [];

            // Get each player by index (max 10 for safety)
            const maxPlayers = Math.min(playerCount, 10);
            for (let i = 0; i < maxPlayers; i++) {
                try {
                    // Get player address
                    const playerData = this.encodeCall('getPlayer', ['uint256'], [i.toString()]);
                    const playerResult = await window.ethereum.request({
                        method: 'eth_call',
                        params: [{
                            to: this.contractAddress,
                            data: playerData
                        }, 'latest']
                    });

                    console.log(`getPlayer(${i}) raw result:`, playerResult);

                    // Extract address from result
                    // Result comes in format 0x + 64 hex chars (32 bytes)
                    // Address takes last 20 bytes (40 hex chars)
                    let playerAddress = '';
                    if (playerResult && playerResult.length >= 42) {
                        // Remove 0x and take last 40 chars, add 0x back
                        const hexWithoutPrefix = playerResult.slice(2);
                        const addressHex = hexWithoutPrefix.slice(-40);
                        playerAddress = '0x' + addressHex;
                    } else {
                        console.error('Invalid player result format:', playerResult);
                        continue;
                    }

                    console.log(`Player ${i}: ${playerAddress}`);

                    // Check that address is valid
                    if (playerAddress === '0x0000000000000000000000000000000000000000') {
                        continue;
                    }

                    // Get player name and score
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
                    // Skip this player and continue
                }
            }

            return players;
        } catch (error) {
            console.warn('Error getting all players, returning empty array:', error);
            // Return empty array instead of throwing error
            return [];
        }
    }

    public async addPlayerScore(playerName: string, walletAddress: string, scoreToAdd: number, wonGame: boolean): Promise<void> {
        await this.ensureCorrectNetwork();

        try {
            const contract = await this.getContract();

            // Call with existing gas parameters
            const tx = await contract.addPlayerScore(playerName, walletAddress, scoreToAdd, wonGame, {
                gasLimit: 0x7A120, // 500k gas limit (same as before)
                gasPrice: 0x9C4653600 // 42 gwei for Avalanche (same as before)
            });

            console.log('Transaction hash:', tx.hash);
            await tx.wait();
            console.log('Transaction confirmed');

            // Give blockchain time to update state
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Notify subscribers of score update
            this.notifyScoreUpdate(walletAddress, scoreToAdd);
        } catch (error) {
            console.error('Failed to add player score:', error);
            throw error;
        }
    }

    // Subscribe to score updates
    public onScoreUpdate(callback: (player: string, score: number) => void): void {
        this.scoreUpdateCallbacks.push(callback);
    }

    // Notify subscribers of score update
    private notifyScoreUpdate(player: string, score: number): void {
        this.scoreUpdateCallbacks.forEach(callback => {
            try {
                callback(player, score);
            } catch (error) {
                console.error('Error in score update callback:', error);
            }
        });
    }

    // Subscribe to score update events
    public subscribeToScoreUpdates(callback: (player: string, score: number) => void): void {
        if (!this.contractAddress) {
            throw new Error('Contract address not set');
        }

        // Simple solution: periodically update data
        // In real project, better to use WebSocket or proper event subscription
        const eventListener = async () => {
            try {
                // Simply call callback to update data
                // Callback will update UI by reloading all data
                console.log('Checking for score updates...');

                // Here we can add logic to check for changes
                // For now just notify that data needs to be updated
            } catch (error) {
                console.error('Error checking for events:', error);
            }
        };

        // Start interval to check events every 10 seconds
        const intervalId = setInterval(eventListener, 10000);

        // Save function for unsubscribing
        this.eventListeners.push(() => {
            clearInterval(intervalId);
        });
    }

    // Unsubscribe from all events
    public unsubscribeFromEvents(): void {
        this.eventListeners.forEach(unsubscribe => unsubscribe());
        this.eventListeners = [];
    }

    /**
     * Encodes function calls using ethers library
     */
    private encodeCall(functionName: string, types: string[], values: string[]): string {
        try {
            // Create ABI fragment for the function
            const abiFragment = {
                name: functionName,
                type: 'function',
                inputs: types.map((type, index) => ({
                    name: `param${index}`,
                    type: type
                }))
            };

            // Create interface with the function
            const iface = new ethers.Interface([abiFragment]);

            // Convert values to appropriate types
            const convertedValues = values.map((value, index) => {
                const type = types[index];
                if (type === 'uint256') {
                    return ethers.parseUnits(value, 0); // Parse as integer
                } else if (type === 'bool') {
                    return value === 'true' || value === '1';
                } else if (type === 'address') {
                    return ethers.getAddress(value); // Validate and checksum address
                }
                return value; // string and other types
            });

            // Encode function call
            const encoded = iface.encodeFunctionData(functionName, convertedValues);
            console.log(`🔧 Ethers encoded ${functionName}:`, encoded);
            return encoded;
        } catch (error) {
            console.error(`❌ Failed to encode function ${functionName}:`, error);
            throw error;
        }
    }
}
