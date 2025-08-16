import { ethers } from 'ethers';

export class WalletManager {
    private connectedAddress: string | null = null;
    private provider: ethers.BrowserProvider | null = null;
    private accountChangeCallbacks: ((accounts: string[]) => void)[] = [];

    constructor() {
        // Restore state from localStorage
        this.connectedAddress = localStorage.getItem('blockchainConnectedAddress');
        this.setupMetaMaskEventListeners();
        this.initializeWalletState();
    }

    /**
     * Initialize wallet state by checking actual MetaMask connection
     */
    private async initializeWalletState(): Promise<void> {
        try {
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

    /**
     * Setup MetaMask event listeners for account changes
     */
    private setupMetaMaskEventListeners(): void {
        if (!window.ethereum || !window.ethereum.on) return;

        const handleAccountsChanged = (accounts: string[]) => {
            console.log('Accounts changed:', accounts);

            if (accounts.length === 0) {
                console.log('User disconnected wallet');
                this.connectedAddress = null;
                localStorage.removeItem('blockchainConnectedAddress');
            } else if (accounts[0] !== this.connectedAddress) {
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

        window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    /**
     * Check if MetaMask is available
     */
    public isMetaMaskAvailable(): boolean {
        return typeof window !== 'undefined' &&
            typeof window.ethereum !== 'undefined' &&
            window.ethereum !== null &&
            window.ethereum.isMetaMask === true;
    }

    /**
     * Check if wallet is actually connected (more reliable than localStorage)
     */
    public async isWalletActuallyConnected(): Promise<boolean> {
        if (!this.isMetaMaskAvailable() || !window.ethereum) {
            return false;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const hasConnectedAccounts = accounts && accounts.length > 0;

            if (hasConnectedAccounts) {
                const currentAccount = accounts[0];
                if (this.connectedAddress !== currentAccount) {
                    this.connectedAddress = currentAccount;
                    localStorage.setItem('blockchainConnectedAddress', currentAccount);
                }
            } else {
                this.connectedAddress = null;
                localStorage.removeItem('blockchainConnectedAddress');
            }

            return hasConnectedAccounts;
        } catch (error) {
            console.warn('Error checking wallet connection:', error);
            this.connectedAddress = null;
            localStorage.removeItem('blockchainConnectedAddress');
            return false;
        }
    }

    /**
     * Connect to MetaMask wallet
     */
    public async connectWallet(): Promise<string | null> {
        if (!this.isMetaMaskAvailable() || !window.ethereum) {
            throw new Error('MetaMask extension not installed or activated');
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
                this.connectedAddress = accounts[0];
                localStorage.setItem('blockchainConnectedAddress', accounts[0]);
                return this.connectedAddress;
            }
            return null;
        } catch (error) {
            console.error('Wallet connection error:', error);
            throw error;
        }
    }

    /**
     * Get connected wallet address
     */
    public getConnectedAddress(): string | null {
        return this.connectedAddress;
    }

    /**
     * Get connected address with real-time verification
     */
    public async getConnectedAddressVerified(): Promise<string | null> {
        const isConnected = await this.isWalletActuallyConnected();
        return isConnected ? this.connectedAddress : null;
    }

    /**
     * Get or create provider instance
     */
    public async getProvider(): Promise<ethers.BrowserProvider> {
        if (!window.ethereum) {
            throw new Error('MetaMask not available');
        }

        if (!this.provider) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
        }
        return this.provider;
    }

    /**
     * Subscribe to account changes
     */
    public onAccountChange(callback: (accounts: string[]) => void): void {
        this.accountChangeCallbacks.push(callback);
    }
}
