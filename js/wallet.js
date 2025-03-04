// Wallet Generation and Management
class DazeeWallet {
    constructor() {
        this.currentPrice = 0;
        this.priceChange = 0;
        this.volume = 0;
        this.stakedAmount = 0;
        this.lastBackupReminder = null;
        this.backupVerified = false;
    }

    // Generate a new Ethereum-style wallet address
    static generateWalletAddress() {
        const characters = '0123456789abcdef';
        let address = '0x';
        for (let i = 0; i < 40; i++) {
            address += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return address;
    }

    // Generate a seed phrase (simplified for demo)
    static generateSeedPhrase() {
        const wordList = [
            "cat", "dog", "fish", "bird", "lion", "tiger", "bear", "wolf", "fox", "deer",
            "pet", "vet", "care", "love", "heal", "help", "kind", "safe", "good", "best",
            "play", "walk", "feed", "grow", "life", "time", "home", "park", "yard", "food"
        ];
        
        let phrase = [];
        for (let i = 0; i < 12; i++) {
            phrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
        }
        return phrase.join(" ");
    }

    // Create a new wallet
    static createNewWallet() {
        const address = this.generateWalletAddress();
        const seedPhrase = this.generateSeedPhrase();
        const initialBalance = 100; // New users get 100 DZ tokens

        // Save wallet info to local storage
        const walletData = {
            address,
            seedPhrase,
            balance: initialBalance,
            stakedAmount: 0,
            lastBackupReminder: new Date().toISOString(),
            backupVerified: false,
            transactions: []
        };
        localStorage.setItem('dazeeWallet', JSON.stringify(walletData));

        // Schedule backup reminder
        this.scheduleBackupReminder();

        return walletData;
    }

    // Transfer DZ tokens
    static async transferTokens(toAddress, amount) {
        const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
        if (!walletData) throw new Error('Wallet not found');
        if (walletData.balance < amount) throw new Error('Insufficient balance');

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        walletData.balance -= amount;
        walletData.transactions.push({
            type: 'transfer',
            to: toAddress,
            amount: amount,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
        return true;
    }

    // Stake DZ tokens
    static async stakeTokens(amount) {
        const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
        if (!walletData) throw new Error('Wallet not found');
        if (walletData.balance < amount) throw new Error('Insufficient balance');

        // Simulate staking delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        walletData.balance -= amount;
        walletData.stakedAmount += amount;
        walletData.transactions.push({
            type: 'stake',
            amount: amount,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
        return {
            stakedAmount: walletData.stakedAmount,
            estimatedRewards: amount * 0.1 // 10% APY
        };
    }

    // Unstake DZ tokens
    static async unstakeTokens(amount) {
        const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
        if (!walletData) throw new Error('Wallet not found');
        if (walletData.stakedAmount < amount) throw new Error('Insufficient staked amount');

        // Simulate unstaking delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const rewards = amount * 0.1; // Calculate rewards
        walletData.stakedAmount -= amount;
        walletData.balance += amount + rewards;
        walletData.transactions.push({
            type: 'unstake',
            amount: amount,
            rewards: rewards,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
        return {
            unstakedAmount: amount,
            rewards: rewards
        };
    }

    // Schedule backup reminder
    static scheduleBackupReminder() {
        const checkBackup = () => {
            const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
            if (!walletData || walletData.backupVerified) return;

            const lastReminder = new Date(walletData.lastBackupReminder);
            const now = new Date();
            const daysSinceLastReminder = (now - lastReminder) / (1000 * 60 * 60 * 24);

            if (daysSinceLastReminder >= 7) {
                this.showBackupReminder();
                walletData.lastBackupReminder = now.toISOString();
                localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
            }
        };

        // Check every day
        setInterval(checkBackup, 24 * 60 * 60 * 1000);
        checkBackup(); // Initial check
    }

    // Show backup reminder modal
    static showBackupReminder() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="dashboard-card rounded-lg p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold text-white mb-6">Backup Reminder 🔐</h3>
                <p class="text-gray-400 mb-6">Please verify that you have saved your recovery phrase in a safe place. Your funds could be lost if you lose access to your wallet.</p>
                <div class="space-y-4">
                    <button onclick="DazeeWallet.verifyBackup()" class="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600">
                        Verify Backup
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="w-full border border-gray-600 text-gray-400 py-3 px-4 rounded-lg hover:bg-gray-900">
                        Remind Me Later
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Verify backup process
    static async verifyBackup() {
        const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
        if (!walletData) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="dashboard-card rounded-lg p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold text-white mb-6">Verify Your Recovery Phrase</h3>
                <p class="text-gray-400 mb-6">Please enter three random words from your recovery phrase:</p>
                <div class="space-y-4" id="verificationForm">
                    <div class="space-y-2">
                        <label class="text-gray-400">Word #<span id="word1Num">?</span></label>
                        <input type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" id="word1">
                    </div>
                    <div class="space-y-2">
                        <label class="text-gray-400">Word #<span id="word2Num">?</span></label>
                        <input type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" id="word2">
                    </div>
                    <div class="space-y-2">
                        <label class="text-gray-400">Word #<span id="word3Num">?</span></label>
                        <input type="text" class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" id="word3">
                    </div>
                    <button onclick="DazeeWallet.checkBackupPhrase()" class="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600">
                        Verify
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Select random words to verify
        const words = walletData.seedPhrase.split(' ');
        const indices = [];
        while (indices.length < 3) {
            const idx = Math.floor(Math.random() * words.length);
            if (!indices.includes(idx)) indices.push(idx);
        }
        
        document.getElementById('word1Num').textContent = indices[0] + 1;
        document.getElementById('word2Num').textContent = indices[1] + 1;
        document.getElementById('word3Num').textContent = indices[2] + 1;

        // Store indices for verification
        localStorage.setItem('verificationIndices', JSON.stringify(indices));
    }

    // Check backup phrase
    static checkBackupPhrase() {
        const walletData = JSON.parse(localStorage.getItem('dazeeWallet'));
        const indices = JSON.parse(localStorage.getItem('verificationIndices'));
        const words = walletData.seedPhrase.split(' ');

        const word1 = document.getElementById('word1').value.trim().toLowerCase();
        const word2 = document.getElementById('word2').value.trim().toLowerCase();
        const word3 = document.getElementById('word3').value.trim().toLowerCase();

        if (word1 === words[indices[0]] && 
            word2 === words[indices[1]] && 
            word3 === words[indices[2]]) {
            
            walletData.backupVerified = true;
            localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
            
            alert('Backup verified successfully! 🎉');
            document.querySelector('.fixed').remove();
        } else {
            alert('Incorrect words. Please try again.');
        }
    }

    // Recover wallet
    static async recoverWallet(seedPhrase) {
        // Validate seed phrase format
        const words = seedPhrase.trim().toLowerCase().split(' ');
        if (words.length !== 12) throw new Error('Invalid recovery phrase');

        // Simulate recovery delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate the same address from seed phrase
        const address = this.generateWalletAddress(); // In a real implementation, this would derive from the seed phrase

        // Create recovered wallet data
        const walletData = {
            address,
            seedPhrase,
            balance: 0, // Would be fetched from blockchain in real implementation
            stakedAmount: 0,
            lastBackupReminder: new Date().toISOString(),
            backupVerified: true,
            transactions: []
        };

        localStorage.setItem('dazeeWallet', JSON.stringify(walletData));
        return walletData;
    }

    // Simulate DazeeCoin price updates
    updatePrice() {
        // Simulate price movement
        const movement = (Math.random() - 0.5) * 0.1;
        this.currentPrice = Math.max(0.1, this.currentPrice + movement);
        this.priceChange = (movement / this.currentPrice) * 100;
        this.volume = Math.random() * 1000000;

        // Update UI elements
        const priceElement = document.getElementById('dzPrice');
        const changeElement = document.getElementById('dzChange');
        const volumeElement = document.getElementById('dzVolume');

        if (priceElement) {
            priceElement.textContent = `$${this.currentPrice.toFixed(2)}`;
        }
        if (changeElement) {
            const changeText = `${this.priceChange >= 0 ? '+' : ''}${this.priceChange.toFixed(2)}%`;
            changeElement.textContent = changeText;
            changeElement.className = this.priceChange >= 0 ? 'text-green-500' : 'text-red-500';
        }
        if (volumeElement) {
            volumeElement.textContent = `Vol: $${this.volume.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }
    }

    // Start price updates
    startPriceUpdates() {
        this.currentPrice = 1.00; // Initial price
        setInterval(() => this.updatePrice(), 5000); // Update every 5 seconds
        this.updatePrice(); // Initial update
    }

    // Connect to external wallet (MetaMask, etc.)
    static async connectExternalWallet() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const address = accounts[0];
                
                // Save connected wallet info
                const walletData = {
                    address,
                    isExternal: true,
                    provider: 'MetaMask',
                    connected: true,
                    connectionTime: new Date().toISOString()
                };
                
                localStorage.setItem('connectedExternalWallet', JSON.stringify(walletData));
                
                // Dispatch event for UI updates
                const event = new CustomEvent('walletConnected', { detail: walletData });
                document.dispatchEvent(event);
                
                return walletData;
            } catch (error) {
                console.error('Error connecting to wallet:', error);
                throw error;
            }
        } else {
            // MetaMask not installed
            const error = new Error('MetaMask not installed');
            error.code = 'NO_METAMASK';
            throw error;
        }
    }
    
    // Check if wallet is connected
    static isWalletConnected() {
        const walletData = JSON.parse(localStorage.getItem('connectedExternalWallet'));
        return walletData && walletData.connected;
    }
    
    // Disconnect external wallet
    static disconnectExternalWallet() {
        localStorage.removeItem('connectedExternalWallet');
        
        // Dispatch event for UI updates
        const event = new CustomEvent('walletDisconnected');
        document.dispatchEvent(event);
    }
}

// Initialize DazeeCoin ticker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const wallet = new DazeeWallet();
    wallet.startPriceUpdates();
    DazeeWallet.scheduleBackupReminder();
});
