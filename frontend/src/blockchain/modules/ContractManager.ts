import { ethers } from 'ethers';
import { PongTournamentScoresBytecode, PongTournamentScoresABI } from '../contractConfig';
import { WalletManager } from './WalletManager';

export class ContractManager {
    private contractAddress: string | null = null;
    private contract: ethers.Contract | null = null;
    private walletManager: WalletManager;

    constructor(walletManager: WalletManager) {
        this.walletManager = walletManager;
        // Restore state from localStorage
        this.contractAddress = localStorage.getItem('blockchainContractAddress');
    }

    /**
     * Set contract address
     */
    public setContractAddress(address: string): void {
        this.contractAddress = address;
        // Save to localStorage for persistence
        localStorage.setItem('blockchainContractAddress', address);
        // Reset contract instance to force recreation with new address
        this.contract = null;
    }

    /**
     * Get contract address
     */
    public getContractAddress(): string | null {
        // Always check localStorage for latest address
        const saved = localStorage.getItem('blockchainContractAddress');
        if (saved && saved !== this.contractAddress) {
            this.contractAddress = saved;
            // Reset contract instance to force recreation
            this.contract = null;
        }
        return this.contractAddress;
    }

    /**
     * Get or create contract instance
     */
    public async getContract(): Promise<ethers.Contract> {
        if (!this.contractAddress) {
            throw new Error('Contract address not set');
        }

        if (!this.contract || this.contract.target !== this.contractAddress) {
            const provider = await this.walletManager.getProvider();
            const signer = await provider.getSigner();
            this.contract = new ethers.Contract(this.contractAddress, PongTournamentScoresABI, signer);
        }
        return this.contract;
    }

    /**
     * Deploy new contract
     */
    public async deployContract(): Promise<string | null> {
        const connectedAddress = this.walletManager.getConnectedAddress();
        if (!connectedAddress) {
            throw new Error('Please connect wallet first');
        }

        if (!this.walletManager.isMetaMaskAvailable() || !window.ethereum) {
            throw new Error('MetaMask extension not available');
        }

        try {
            console.log('Deploying contract...');

            const provider = await this.walletManager.getProvider();
            const signer = await provider.getSigner();

            // Create contract factory with ethers
            const contractFactory = new ethers.ContractFactory(
                PongTournamentScoresABI,
                PongTournamentScoresBytecode,
                signer
            );

            // Deploy with gas parameters
            const contract = await contractFactory.deploy({
                gasLimit: 0x1E8480, // 2M gas limit
                gasPrice: 0x9C4653600, // 42 gwei for Avalanche
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
}
