// Wallet Connection Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get wallet buttons
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const mobileConnectWalletBtn = document.getElementById('mobileConnectWalletBtn');
    const mobileWalletConnect = document.getElementById('mobileWalletConnect');
    const walletBtnText = document.getElementById('walletBtnText');
    
    // Check if wallet is already connected
    const updateWalletUI = () => {
        if (DazeeWallet.isWalletConnected()) {
            const walletData = JSON.parse(localStorage.getItem('connectedExternalWallet'));
            const shortAddress = `${walletData.address.substring(0, 6)}...${walletData.address.substring(walletData.address.length - 4)}`;
            
            if (walletBtnText) {
                walletBtnText.textContent = shortAddress;
            }
            
            if (connectWalletBtn) {
                connectWalletBtn.classList.remove('from-orange-500', 'to-orange-600');
                connectWalletBtn.classList.add('from-green-500', 'to-green-600');
            }
            
            if (mobileWalletConnect) {
                mobileWalletConnect.innerHTML = `<i class="fas fa-wallet"></i> ${shortAddress}`;
            }
        } else {
            if (walletBtnText) {
                walletBtnText.textContent = 'Connect Wallet';
            }
            
            if (connectWalletBtn) {
                connectWalletBtn.classList.remove('from-green-500', 'to-green-600');
                connectWalletBtn.classList.add('from-orange-500', 'to-orange-600');
            }
            
            if (mobileWalletConnect) {
                mobileWalletConnect.innerHTML = `<i class="fas fa-wallet"></i> Connect Wallet`;
            }
        }
    };
    
    // Handle wallet connection
    const handleConnectWallet = async () => {
        try {
            if (DazeeWallet.isWalletConnected()) {
                // Disconnect wallet
                DazeeWallet.disconnectExternalWallet();
                updateWalletUI();
                
                // Show disconnected notification
                showNotification('Wallet disconnected', 'success');
            } else {
                // Connect wallet
                await DazeeWallet.connectExternalWallet();
                updateWalletUI();
                
                // Show connected notification
                const walletData = JSON.parse(localStorage.getItem('connectedExternalWallet'));
                showNotification(`Connected to ${walletData.provider}`, 'success');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            
            if (error.code === 'NO_METAMASK') {
                showNotification('MetaMask not installed. Please install MetaMask to connect your wallet.', 'error');
            } else {
                showNotification('Failed to connect wallet. Please try again.', 'error');
            }
        }
    };
    
    // Show notification
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-800 text-white' : 
            type === 'error' ? 'bg-red-800 text-white' : 
            'bg-gray-800 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle'
                } mr-3"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    // Add event listeners
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', handleConnectWallet);
    }
    
    if (mobileConnectWalletBtn) {
        mobileConnectWalletBtn.addEventListener('click', handleConnectWallet);
    }
    
    if (mobileWalletConnect) {
        mobileWalletConnect.addEventListener('click', handleConnectWallet);
    }
    
    // Listen for wallet connection events
    document.addEventListener('walletConnected', (event) => {
        updateWalletUI();
    });
    
    document.addEventListener('walletDisconnected', () => {
        updateWalletUI();
    });
    
    // Initial UI update
    updateWalletUI();
});
