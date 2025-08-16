export class NetworkManager {
    private networkChangeCallbacks: ((chainId: string, networkName: string) => void)[] = [];

    constructor() {
        this.setupNetworkEventListeners();
    }

    /**
     * Setup MetaMask event listeners for network changes
     */
    private setupNetworkEventListeners(): void {
        if (!window.ethereum || !window.ethereum.on) return;

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

        window.ethereum.on('chainChanged', handleChainChanged);
    }

    /**
     * Switch to Avalanche C-Chain (with Fuji Testnet support)
     */
    private async switchToAvalancheNetwork(): Promise<void> {
        if (!window.ethereum) return;

        try {
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

    /**
     * Check if we're on a supported Avalanche network
     */
    public async ensureCorrectNetwork(): Promise<void> {
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

    /**
     * Get current network information
     */
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

    /**
     * Subscribe to network changes
     */
    public onNetworkChange(callback: (chainId: string, networkName: string) => void): void {
        this.networkChangeCallbacks.push(callback);
    }
}
