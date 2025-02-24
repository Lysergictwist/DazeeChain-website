class ShelterOnboarding {
    static async sendWelcomeEmail(shelterData, verificationResults) {
        const emailTemplate = this.generateWelcomeEmail(shelterData, verificationResults);
        
        // In production, this would use a proper email service like SendGrid
        await this.sendEmail(shelterData.email, emailTemplate);
    }

    static generateWelcomeEmail(shelterData, verificationResults) {
        return {
            subject: 'Welcome to DazeeChain - Your Shelter Has Been Verified!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #FF6B6B;">Welcome to DazeeChain!</h1>
                    
                    <p>Dear ${shelterData.contactName},</p>
                    
                    <p>Congratulations! ${shelterData.shelterName} has been successfully verified on DazeeChain with a verification score of ${verificationResults.score}%.</p>
                    
                    <h2 style="color: #4A90E2;">About DazeeChain</h2>
                    <p>DazeeChain is a revolutionary platform connecting animal shelters with cryptocurrency donations. Our mission is to make animal welfare funding transparent, efficient, and accessible globally.</p>
                    
                    <h2 style="color: #4A90E2;">Your Next Steps</h2>
                    <ol>
                        <li><strong>Choose Your Preferred Currency:</strong>
                            <ul>
                                <li>DazeeCoin (DZ) - Our native token with special benefits</li>
                                <li>USDT - A stable cryptocurrency pegged to the US Dollar</li>
                            </ul>
                        </li>
                        <li><strong>Set Up Your Wallet:</strong>
                            <ul>
                                <li>If you're new to cryptocurrency, we recommend installing MetaMask:</li>
                                <li><a href="https://metamask.io/download/" style="color: #4A90E2;">Download MetaMask</a></li>
                                <li>Already have a wallet? Simply provide your Ethereum wallet address</li>
                            </ul>
                        </li>
                    </ol>

                    <div style="background-color: #F5F5F5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #4A90E2;">Ready to Get Started?</h3>
                        <p>Click the button below to set up your donation preferences and wallet:</p>
                        <a href="${process.env.APP_URL}/shelter/setup/${shelterData.verificationId}" 
                           style="background-color: #FF6B6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Complete Your Setup
                        </a>
                    </div>

                    <h2 style="color: #4A90E2;">Need Help?</h2>
                    <p>We've prepared some resources to help you get started:</p>
                    <ul>
                        <li><a href="${process.env.APP_URL}/guides/metamask-setup" style="color: #4A90E2;">MetaMask Setup Guide</a></li>
                        <li><a href="${process.env.APP_URL}/guides/crypto-basics" style="color: #4A90E2;">Cryptocurrency Basics</a></li>
                        <li><a href="${process.env.APP_URL}/guides/dazeecoin" style="color: #4A90E2;">About DazeeCoin</a></li>
                    </ul>

                    <p>If you have any questions, our support team is here to help 24/7:</p>
                    <ul>
                        <li>Email: support@dazeechain.com</li>
                        <li>Phone: 1-800-DAZEE</li>
                        <li>Live Chat: Available on our website</li>
                    </ul>

                    <p style="color: #666; font-size: 12px; margin-top: 40px;">
                        This email was sent to ${shelterData.email}. If you did not request this verification, 
                        please contact our support team immediately.
                    </p>
                </div>
            `
        };
    }

    static async setupWallet(shelterData, walletPreference) {
        const walletSetup = {
            dazeecoin: {
                async setup() {
                    // Check if MetaMask is installed
                    if (typeof window.ethereum !== 'undefined') {
                        try {
                            // Request account access
                            const accounts = await window.ethereum.request({ 
                                method: 'eth_requestAccounts' 
                            });
                            
                            // Add DazeeCoin token to MetaMask
                            await window.ethereum.request({
                                method: 'wallet_watchAsset',
                                params: {
                                    type: 'ERC20',
                                    options: {
                                        address: process.env.DAZEECOIN_CONTRACT_ADDRESS,
                                        symbol: 'DZ',
                                        decimals: 18,
                                        image: process.env.APP_URL + '/images/dazee.jpg'
                                    }
                                }
                            });

                            return {
                                status: 'success',
                                address: accounts[0],
                                type: 'dazeecoin'
                            };
                        } catch (error) {
                            console.error('MetaMask setup error:', error);
                            return {
                                status: 'error',
                                message: 'Failed to setup MetaMask',
                                error
                            };
                        }
                    } else {
                        return {
                            status: 'error',
                            message: 'MetaMask not installed',
                            redirectUrl: 'https://metamask.io/download/'
                        };
                    }
                }
            },
            usdt: {
                async setup() {
                    // Similar to DazeeCoin setup but for USDT
                    if (typeof window.ethereum !== 'undefined') {
                        try {
                            const accounts = await window.ethereum.request({ 
                                method: 'eth_requestAccounts' 
                            });
                            
                            // Add USDT token to MetaMask
                            await window.ethereum.request({
                                method: 'wallet_watchAsset',
                                params: {
                                    type: 'ERC20',
                                    options: {
                                        address: process.env.USDT_CONTRACT_ADDRESS,
                                        symbol: 'USDT',
                                        decimals: 6,
                                        image: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
                                    }
                                }
                            });

                            return {
                                status: 'success',
                                address: accounts[0],
                                type: 'usdt'
                            };
                        } catch (error) {
                            console.error('USDT setup error:', error);
                            return {
                                status: 'error',
                                message: 'Failed to setup USDT wallet',
                                error
                            };
                        }
                    } else {
                        return {
                            status: 'error',
                            message: 'MetaMask not installed',
                            redirectUrl: 'https://metamask.io/download/'
                        };
                    }
                }
            }
        };

        return await walletSetup[walletPreference].setup();
    }

    static async saveShelterPreferences(shelterData, preferences) {
        try {
            const shelterPreferences = {
                shelterId: shelterData.verificationId,
                preferredCurrency: preferences.currency,
                walletAddress: preferences.walletAddress,
                walletType: preferences.walletType,
                notificationPreferences: preferences.notifications || 'email',
                payoutThreshold: preferences.payoutThreshold || '100',
                autoConvert: preferences.autoConvert || false,
                timestamp: new Date().toISOString()
            };

            // In production, this would save to your database
            await this.storeShelterPreferences(shelterPreferences);

            return {
                status: 'success',
                message: 'Preferences saved successfully',
                preferences: shelterPreferences
            };
        } catch (error) {
            console.error('Error saving preferences:', error);
            return {
                status: 'error',
                message: 'Failed to save preferences',
                error
            };
        }
    }

    static async sendEmail(email, template) {
        // In production, implement your email service here
        console.log('Sending email to:', email);
        console.log('Template:', template);
    }

    static async storeShelterPreferences(preferences) {
        // In production, implement your database storage here
        console.log('Storing preferences:', preferences);
    }
}

// Make the class available globally
window.ShelterOnboarding = ShelterOnboarding;
