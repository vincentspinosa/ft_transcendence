import { ethers } from 'ethers';
import { ContractManager } from './ContractManager';
import { NetworkManager } from './NetworkManager';

export interface PlayerStats {
    name: string;
    address: string;
    totalScore: number;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
}

export class PlayerDataManager {
    private contractManager: ContractManager;
    private networkManager: NetworkManager;

    constructor(contractManager: ContractManager, networkManager: NetworkManager) {
        this.contractManager = contractManager;
        this.networkManager = networkManager;
    }

    /**
     * Get player score by address
     */
    public async getPlayerScore(playerAddress: string): Promise<number> {
        await this.networkManager.ensureCorrectNetwork();

        try {
            const contract = await this.contractManager.getContract();
            const score = await contract.getScore(playerAddress);
            return Number(score);
        } catch (error) {
            console.error('Error getting player score:', error);
            return 0;
        }
    }

    /**
     * Get player name by address
     */
    public async getPlayerName(playerAddress: string): Promise<string> {
        try {
            const contract = await this.contractManager.getContract();
            const name = await contract.getPlayerName(playerAddress);
            return name || '';
        } catch (error) {
            console.warn('⚠️ Error getting player name (using fallback):', error);
            return '';
        }
    }

    /**
     * Get all unique players with full statistics
     */
    public async getAllUniquePlayersWithStats(): Promise<PlayerStats[]> {
        try {
            await this.networkManager.ensureCorrectNetwork();
            const contract = await this.contractManager.getContract();

            const [names, addresses, scores, gamesPlayed, gamesWon] = await contract.getAllUniquePlayersWithStats();

            const playersData: PlayerStats[] = [];
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

    /**
     * Fallback to legacy function for compatibility
     */
    private async getAllPlayersLegacy(): Promise<PlayerStats[]> {
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

    /**
     * Legacy getAllPlayers function for compatibility
     */
    public async getAllPlayers(): Promise<Array<{ address: string, name: string, score: number }>> {
        const contractAddress = this.contractManager.getContractAddress();
        if (!contractAddress) {
            console.warn('Contract address not set');
            return [];
        }

        if (!window.ethereum) {
            console.warn('MetaMask not available');
            return [];
        }

        try {
            // First try to get player count
            const countData = this.encodeCall('getPlayersCount', [], []);
            const countResult = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: contractAddress,
                    data: countData
                }, 'latest']
            });

            const playerCount = parseInt(countResult, 16);
            console.log(`📊 Player count from contract ${contractAddress}: ${playerCount} (raw: ${countResult})`);

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
                            to: contractAddress,
                            data: playerData
                        }, 'latest']
                    });

                    console.log(`getPlayer(${i}) raw result:`, playerResult);

                    // Extract address from result
                    let playerAddress = '';
                    if (playerResult && playerResult.length >= 42) {
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
            return [];
        }
    }

    /**
     * Add player score and game result
     */
    public async addPlayerScore(playerName: string, walletAddress: string, scoreToAdd: number, wonGame: boolean): Promise<void> {
        await this.networkManager.ensureCorrectNetwork();

        try {
            const contract = await this.contractManager.getContract();

            // Call with gas parameters
            const tx = await contract.addPlayerScore(playerName, walletAddress, scoreToAdd, wonGame, {
                gasLimit: 0x7A120, // 500k gas limit
                gasPrice: 0x9C4653600 // 42 gwei for Avalanche
            });

            console.log('Transaction hash:', tx.hash);
            await tx.wait();
            console.log('Transaction confirmed');

            // Give blockchain time to update state
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Failed to add player score:', error);
            throw error;
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
}
