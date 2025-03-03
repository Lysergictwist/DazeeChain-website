/**
 * Admin Authentication Module
 * This module handles admin authentication, session management, and access control
 */
const adminAuth = {
    // Admin session data
    session: null,
    
    // Check if user is authenticated
    get isAuthenticated() {
        if (!this.session) {
            this.loadSession();
        }
        return !!this.session;
    },
    
    // Initialize admin auth
    init() {
        this.loadSession();
        // Check if we need to authenticate via wallet
        if (window.ethereum && !this.isAuthenticated) {
            this.checkWalletAuth();
        }
    },
    
    // Load session from localStorage
    loadSession() {
        const sessionData = localStorage.getItem('adminSession');
        if (sessionData) {
            try {
                this.session = JSON.parse(sessionData);
                // Check if session is expired
                if (this.session.expiresAt && new Date(this.session.expiresAt) < new Date()) {
                    this.logout();
                    return false;
                }
                return true;
            } catch (e) {
                console.error('Error parsing admin session', e);
                this.logout();
                return false;
            }
        }
        return false;
    },
    
    // Save session to localStorage
    saveSession() {
        if (this.session) {
            localStorage.setItem('adminSession', JSON.stringify(this.session));
        }
    },
    
    // Check if the connected wallet is an admin wallet
    async checkWalletAuth() {
        if (!window.ethereum) return false;
        
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length === 0) return false;
            
            const walletAddress = accounts[0];
            
            // Check if this wallet is an admin wallet
            // In production, this would check against a database or smart contract
            const adminWallets = [
                '0xYourAdminWalletAddress', // Replace with your actual wallet address
                '0x123456789abcdef123456789abcdef123456789' // Example wallet for demo
            ];
            
            if (adminWallets.includes(walletAddress.toLowerCase())) {
                // Create admin session
                this.session = {
                    id: this.generateSessionId(),
                    walletAddress: walletAddress,
                    username: 'Admin', // Default name for wallet-based auth
                    role: 'admin',
                    permissions: ['approve_shelters', 'reject_shelters', 'request_more_info'],
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
                };
                this.saveSession();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking wallet authentication', error);
            return false;
        }
    },
    
    // Login with username and password
    login(username, password) {
        // For demo purposes only - in production, this would validate against a secure backend
        if (username === 'admin' && password === 'dazeecoin2025') {
            this.session = {
                id: this.generateSessionId(),
                username: 'Admin',
                role: 'admin',
                permissions: ['approve_shelters', 'reject_shelters', 'request_more_info'],
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };
            this.saveSession();
            return true;
        }
        return false;
    },
    
    // Logout
    logout() {
        this.session = null;
        localStorage.removeItem('adminSession');
    },
    
    // Check if user has a specific permission
    hasPermission(permission) {
        if (!this.isAuthenticated) return false;
        return this.session.permissions.includes(permission);
    },
    
    // Generate a random session ID
    generateSessionId() {
        return 'admin-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
};

// Initialize admin auth when the script loads
document.addEventListener('DOMContentLoaded', () => {
    adminAuth.init();
});
