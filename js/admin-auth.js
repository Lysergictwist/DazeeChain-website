/**
 * Admin Authentication Module for DazeeChain
 * Handles admin login, session management, and access control
 */
class AdminAuth {
    constructor() {
        this.currentAdmin = null;
        this.isAuthenticated = false;
        
        // Check if admin is already logged in
        this.checkAuthStatus();
    }
    
    /**
     * Check if admin is already authenticated
     */
    checkAuthStatus() {
        const adminData = localStorage.getItem('dazeechain_admin');
        
        if (adminData) {
            try {
                this.currentAdmin = JSON.parse(adminData);
                this.isAuthenticated = true;
                
                // Auto-login for demo purposes
                if (window.location.pathname.includes('/admin/') && !this.isAuthenticated) {
                    window.location.href = '../admin-login.html';
                }
                
                return true;
            } catch (e) {
                console.error('Error parsing admin data:', e);
                localStorage.removeItem('dazeechain_admin');
            }
        }
        
        return false;
    }
    
    /**
     * Login as admin
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {boolean} - Login success status
     */
    login(username, password) {
        // For demo purposes, hardcoded admin credentials
        // In production, this would validate against a secure backend
        if (username === 'admin' && password === 'dazeecoin2025') {
            const adminData = {
                id: 'admin-001',
                username: username,
                name: 'System Administrator',
                role: 'super_admin',
                permissions: ['approve_shelters', 'manage_users', 'view_analytics'],
                lastLogin: new Date().toISOString()
            };
            
            // Store admin data in localStorage
            localStorage.setItem('dazeechain_admin', JSON.stringify(adminData));
            
            this.currentAdmin = adminData;
            this.isAuthenticated = true;
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Logout current admin
     */
    logout() {
        localStorage.removeItem('dazeechain_admin');
        this.currentAdmin = null;
        this.isAuthenticated = false;
        
        // Redirect to login page
        window.location.href = '../admin-login.html';
    }
    
    /**
     * Check if current admin has specific permission
     * @param {string} permission - Permission to check
     * @returns {boolean} - Has permission
     */
    hasPermission(permission) {
        if (!this.isAuthenticated || !this.currentAdmin) {
            return false;
        }
        
        return this.currentAdmin.permissions.includes(permission);
    }
    
    /**
     * Get current admin data
     * @returns {object|null} - Admin data or null if not authenticated
     */
    getAdminData() {
        return this.currentAdmin;
    }
}

// Create global instance
const adminAuth = new AdminAuth();

// Auto-login for demo purposes (REMOVE IN PRODUCTION)
if (window.location.pathname.includes('/admin/') && !adminAuth.isAuthenticated) {
    // Force login with default credentials for demo
    adminAuth.login('admin', 'dazeecoin2025');
}
