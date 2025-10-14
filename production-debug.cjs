// Production Debug Script - Access pipeline directly
const puppeteer = require('puppeteer');

async function debugProduction() {
    console.log('🚀 Accessing Production Site: https://crm-ai-rho.vercel.app');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Capture console logs from the page
        const consoleLogs = [];
        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
        });
        
        // Navigate to opportunities page
        console.log('🔍 Navigating to /dashboard/opportunities...');
        await page.goto('https://crm-ai-rho.vercel.app/dashboard/opportunities', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for page to load completely
        await page.waitForTimeout(5000);
        
        // Try to find any error messages
        const pageContent = await page.content();
        
        // Check for login redirect
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        
        if (currentUrl.includes('/login')) {
            console.log('🔓 Page redirected to login - authentication required');
            console.log('📊 This means the app is working, but needs login credentials');
        }
        
        // Output console logs
        console.log('\n📋 CONSOLE LOGS FROM PRODUCTION:');
        console.log('================================');
        consoleLogs.forEach((log, index) => {
            console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.text}`);
        });
        
        // Check for specific elements that might indicate the issue
        const hasOpportunityElements = await page.evaluate(() => {
            return {
                hasLoginForm: !!document.querySelector('form input[type="email"]'),
                hasOpportunityBoard: !!document.querySelector('[data-testid="opportunity-board"]'),
                hasKanbanColumns: !!document.querySelectorAll('.kanban-column').length,
                hasErrorMessage: !!document.querySelector('.error-message'),
                bodyText: document.body.textContent.substring(0, 500)
            };
        });
        
        console.log('\n🔍 PAGE ANALYSIS:');
        console.log('================');
        console.log('Has Login Form:', hasOpportunityElements.hasLoginForm);
        console.log('Has Opportunity Board:', hasOpportunityElements.hasOpportunityBoard);
        console.log('Has Kanban Columns:', hasOpportunityElements.hasKanbanColumns);
        console.log('Has Error Message:', hasOpportunityElements.hasErrorMessage);
        console.log('Body Preview:', hasOpportunityElements.bodyText);
        
        // Since we need to login, let's check the main page structure
        console.log('\n📄 PAGE TITLE:', await page.title());
        
    } catch (error) {
        console.error('❌ Error accessing production:', error.message);
    } finally {
        await browser.close();
    }
}

debugProduction().catch(console.error);