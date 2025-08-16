import { PongTournamentScoresBytecode } from './contractConfig';
import { ethers } from 'ethers';

export class BlockchainService {
    private contractAddress: string | null = null;
    private connectedAddress: string | null = null;
    private eventListeners: (() => void)[] = [];
    private scoreUpdateCallbacks: ((player: string, score: number) => void)[] = [];
    private networkChangeCallbacks: ((chainId: string, networkName: string) => void)[] = [];
    private accountChangeCallbacks: ((accounts: string[]) => void)[] = [];

    constructor() {
        // Restore state from localStorage
        this.contractAddress = localStorage.getItem('blockchainContractAddress');
        this.connectedAddress = localStorage.getItem('blockchainConnectedAddress');
        
        // Setup event listeners for MetaMask changes
        this.setupMetaMaskEventListeners();
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

    // Check MetaMask availability
    private isMetaMaskAvailable(): boolean {
        return typeof window !== 'undefined' &&
            typeof window.ethereum !== 'undefined' &&
            window.ethereum !== null &&
            window.ethereum.isMetaMask === true;
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

    // Add method to switch to Fuji Testnet (for development)
    private async switchToFujiTestnet(): Promise<void> {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xa869' }], // Fuji Testnet
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xa869',
                        chainName: 'Avalanche Fuji Testnet',
                        nativeCurrency: {
                            name: 'AVAX',
                            symbol: 'AVAX',
                            decimals: 18,
                        },
                        rpcUrls: [
                            'https://api.avax-test.network/ext/bc/C/rpc'
                        ],
                        blockExplorerUrls: ['https://testnet.snowtrace.io/'],
                    }],
                });
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

    // Public method to switch to Fuji Testnet for development
    public async switchToTestnet(): Promise<void> {
        await this.switchToFujiTestnet();
    }

    // Public method to check current network
    public async getCurrentNetwork(): Promise<{chainId: string, name: string}> {
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
        // Check local state first
        if (this.connectedAddress) {
            return this.connectedAddress;
        }
        // Fall back to localStorage
        const saved = localStorage.getItem('blockchainConnectedAddress');
        if (saved) {
            this.connectedAddress = saved;
            return saved;
        }
        return null;
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

    // Force refresh contract address from localStorage
    public refreshContractAddress(): string | null {
        const saved = localStorage.getItem('blockchainContractAddress');
        if (saved) {
            this.contractAddress = saved;
            // console.log(`♻️ Refreshed contract address: ${saved}`);
        }
        return this.contractAddress;
    }

    // Deploy new smart contract
    public async deployContract(): Promise<string | null> {
        if (!this.connectedAddress) {
            throw new Error('Please connect wallet first');
        }

        if (!this.isMetaMaskAvailable() || !window.ethereum) {
            throw new Error('MetaMask extension not available');
        }

        try {
            // Validate contract bytecode
            if (!PongTournamentScoresBytecode || !PongTournamentScoresBytecode.startsWith('0x')) {
                throw new Error('Invalid contract bytecode');
            }

            console.log('Deploying contract...');

            // Deploy contract via MetaMask on Avalanche
            const params = {
                from: this.connectedAddress,
                data: PongTournamentScoresBytecode,
                gas: '0x1E8480', // 2M gas limit
                gasPrice: '0x9C4653600', // 42 gwei for Avalanche
                value: '0x0' // No ETH transfer
            };

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [params]
            });

            // Wait for transaction and get contract address
            const receipt = await this.waitForTransaction(txHash);
            if (receipt && receipt.contractAddress) {
                this.setContractAddress(receipt.contractAddress);
                return this.contractAddress;
            }
            return null;
        } catch (error) {
            console.error('Contract deployment failed:', error);
            throw error;
        }
    }

    // Wait for transaction confirmation
    private async waitForTransaction(txHash: string): Promise<any> {
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        return new Promise((resolve, reject) => {
            const checkReceipt = async () => {
                try {
                    if (!window.ethereum) {
                        reject(new Error('MetaMask connection lost'));
                        return;
                    }

                    const receipt = await window.ethereum.request({
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

    // Get player score by address
    public async getPlayerScore(playerAddress: string): Promise<number> {
        if (!this.contractAddress) {
            throw new Error('Contract address not set');
        }

        // Ensure we're on the correct network
        await this.ensureCorrectNetwork();

        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        try {
            // Encode function call using ethers
            const data = this.encodeCall('getScore', ['address'], [playerAddress]);

            // Call contract
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data
                }, 'latest']
            });

            // Decode result using ethers
            const decoded = this.decodeResult(result, ['uint256']);
            return typeof decoded === 'bigint' ? Number(decoded) : (decoded as number) || 0;
        } catch (error) {
            console.error('Error getting player score:', error);
            throw error;
        }
    }

    // Get player name from blockchain
    public async getPlayerName(playerAddress: string): Promise<string> {
        if (!this.contractAddress) {
            throw new Error('Contract address not set');
        }

        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        try {
            // Encode function call using ethers
            const data = this.encodeCall('getPlayerName', ['address'], [playerAddress]);

            // Call contract
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data
                }, 'latest']
            });

            console.log(`getPlayerName(${playerAddress}) raw result:`, result);

            // Decode string using ethers
            const decoded = this.decodeResult(result, ['string']);
            return decoded || '';
        } catch (error) {
            console.warn('⚠️ Error getting player name (using fallback):', error);
            return ''; // Return empty string instead of throwing
        }
    }

    // Get all unique players with full statistics
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

        // Ensure we're on the correct network
        try {
            await this.ensureCorrectNetwork();
        } catch (networkError) {
            console.error('Network check failed:', networkError);
            return [];
        }

        if (!window.ethereum) {
            console.warn('MetaMask not available');
            return [];
        }

        try {
            // Use new getAllUniquePlayersWithStats function
            const data = this.encodeCall('getAllUniquePlayersWithStats', [], []);
            
            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: data
                }, 'latest']
            });

            console.log('Raw result from getAllUniquePlayersWithStats:', result);

            if (!result || result === '0x' || result.length < 130) {
                console.log('⚠️ No valid data returned from contract, trying legacy method');
                return await this.getAllPlayersLegacy();
            }

            // Try to use ethers for decoding, fallback to legacy if fails
            try {
                // Define return types for the function
                const returnTypes = ['string[]', 'address[]', 'uint256[]', 'uint256[]', 'uint256[]'];
                const decoded = this.decodeResult(result, returnTypes);
                
                console.log('🔍 Ethers decoded result:', decoded);
                
                if (Array.isArray(decoded) && decoded.length === 5) {
                    const [names, addresses, scores, gamesPlayed, gamesWon] = decoded;
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

                    console.log(`✅ Successfully decoded ${playersData.length} players using ethers`);
                    return playersData;
                }
            } catch (ethersError) {
                console.warn('⚠️ Ethers decoding failed, using legacy method:', ethersError);
            }

            // Fallback to legacy decoding
            const players = this.decodeMultipleArraysResult(result, 5);
            
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

    // Add player score to blockchain
    public async addPlayerScore(playerName: string, walletAddress: string, scoreToAdd: number, wonGame: boolean): Promise<void> {
        if (!this.contractAddress || !this.connectedAddress) {
            throw new Error('Contract address or wallet connection not set');
        }

        // Ensure we're on the correct network
        await this.ensureCorrectNetwork();

        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        try {
            // console.log(`🎮 Adding score for player: "${playerName}", wallet: ${walletAddress}, score: ${scoreToAdd}, won: ${wonGame}`);
            // Encode function call for addPlayerScore
            const data = this.encodeCall('addPlayerScore',
                ['string', 'address', 'uint256', 'bool'],
                [playerName, walletAddress, scoreToAdd.toString(), wonGame.toString()]);

            // console.log('Transaction data:', data);

            // Transaction parameters with gas settings for Avalanche
            const txParams = {
                from: this.connectedAddress,
                to: this.contractAddress,
                data,
                gas: '0x7A120', // 500k gas limit for complex operations
                gasPrice: '0x9C4653600' // 42 gwei for Avalanche network
            };

            // console.log('Transaction params:', txParams);
            // console.log(`📍 Using contract address for WRITE: ${this.contractAddress}`);

            // Send transaction
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [txParams]
            });

            console.log('Transaction hash:', txHash);

            if (!txHash) {
                throw new Error('No transaction hash received');
            }

            // Wait for transaction confirmation
            await this.waitForTransaction(txHash);

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

    // Set player score (updated function)
    public async setPlayerScore(playerAddress: string, playerName: string, score: number): Promise<void> {
        // Use new addPlayerScore function, considering player won if they have points
        await this.addPlayerScore(playerName, playerAddress, score, score > 0);
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

    // Method to decode results with multiple arrays
    private decodeMultipleArraysResult(result: string, arrayCount: number): any[][] {
        try {
            if (!result || result === '0x' || result.length < 130) {
                return [];
            }

            // Skip first 2 chars (0x)
            const data = result.slice(2);

            // Read offsets for each array
            const offsets = [];
            for (let i = 0; i < arrayCount; i++) {
                const offsetHex = data.slice(i * 64, (i + 1) * 64);
                offsets.push(parseInt(offsetHex, 16) * 2); // Multiply by 2 for hex
            }

            const arrays = [];

            for (let i = 0; i < arrayCount; i++) {
                const offset = offsets[i];

                // Check bounds
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
                    // First array - string array (player names)
                    console.log(`🔤 Decoding ${length} strings from array ${i}`);

                    // Read offsets for each string
                    const stringOffsets = [];
                    for (let j = 0; j < length; j++) {
                        const stringOffsetHex = data.slice(offset + 64 + (j * 64), offset + 64 + ((j + 1) * 64));
                        const relativeOffset = parseInt(stringOffsetHex, 16) * 2;
                        stringOffsets.push(relativeOffset);
                        console.log(`String ${j} relative offset: ${relativeOffset}`);
                    }

                    for (let j = 0; j < length; j++) {
                        const stringAbsoluteOffset = offset + stringOffsets[j];
                        // console.log(`🔍 Processing string ${j} at absolute offset ${stringAbsoluteOffset}`);

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

                        // Get hex data for string
                        const stringDataStartOffset = stringAbsoluteOffset + 64;
                        const stringDataHex = data.slice(stringDataStartOffset, stringDataStartOffset + (stringLength * 2));
                        console.log(`String ${j} hex data (${stringLength} chars): ${stringDataHex}`);

                        // Decode hex to UTF-8 string
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

                        // Clean string from garbage
                        stringValue = stringValue.replace(/[^\x20-\x7E]/g, '').trim();
                        console.log(`✅ Decoded string ${j}: "${stringValue}"`);
                        arrayData.push(stringValue || `Player ${j + 1}`);
                    }
                } else {
                    // Other arrays - simple data types
                    for (let j = 0; j < length; j++) {
                        const itemOffset = offset + 64 + (j * 64);
                        if (itemOffset + 64 > data.length) {
                            arrayData.push(i === 1 ? '0x0000000000000000000000000000000000000000' : 0);
                            continue;
                        }

                        const itemHex = data.slice(itemOffset, itemOffset + 64);

                        if (i === 1) {
                            // Second array - addresses
                            const addressHex = itemHex.slice(-40);
                            arrayData.push('0x' + addressHex);
                        } else {
                            // Other arrays - numbers
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

    /**
     * Decodes function result using ethers library
     */
    private decodeResult(result: string, returnTypes: string[]): any {
        try {
            if (!result || result === '0x' || result.length <= 2) {
                return returnTypes.length === 1 ? null : [];
            }

            // For simple types, use ethers AbiCoder
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            const decoded = abiCoder.decode(returnTypes, result);
            
            console.log(`🔍 Ethers decoded result:`, decoded);
            return decoded.length === 1 ? decoded[0] : decoded;
        } catch (error) {
            console.error(`❌ Failed to decode result:`, error);
            // Fallback to legacy decoding for complex types
            return this.legacyDecodeResult(result, returnTypes);
        }
    }

    /**
     * Legacy decode method for complex return types (fallback)
     */
    private legacyDecodeResult(result: string, returnTypes: string[]): any {
        if (returnTypes.length === 1 && returnTypes[0] === 'uint256') {
            return parseInt(result, 16);
        }
        if (returnTypes.length === 1 && returnTypes[0] === 'string') {
            return this.decodeString(result);
        }
        // For complex types, return raw result
        return result;
    }

    /**
     * Decode string from hex (legacy method)
     */
    private decodeString(result: string): string {
        try {
            if (!result || result === '0x' || result.length < 130) {
                return '';
            }

            const data = result.slice(2);
            const lengthHex = data.slice(64, 128);
            const length = parseInt(lengthHex, 16);
            
            if (length === 0) return '';

            const stringHex = data.slice(128, 128 + length * 2);
            const bytes = [];
            for (let i = 0; i < stringHex.length; i += 2) {
                bytes.push(parseInt(stringHex.slice(i, i + 2), 16));
            }
            return new TextDecoder().decode(new Uint8Array(bytes));
        } catch (error) {
            console.warn('Failed to decode string:', error);
            return '';
        }
    }
}
