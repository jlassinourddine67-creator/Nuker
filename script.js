// script.js - Discord Bot Controller
// Full destruction commands via WebSocket/API

let ws = null;
let botConnected = false;
let currentGuildId = null;

// DOM elements
const tokenInput = document.getElementById('botToken');
const connectBtn = document.getElementById('connectBtn');
const statusMsg = document.getElementById('statusMsg');
const statsPanel = document.getElementById('statsPanel');
const commandsPanel = document.getElementById('commandsPanel');
const consolePanel = document.getElementById('consolePanel');
const consoleLog = document.getElementById('consoleLog');

// Helper: add log entry
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleLog.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Helper: update stats
function updateStats(data) {
    if (data.guildCount) document.getElementById('guildCount').innerText = data.guildCount;
    if (data.userCount) document.getElementById('userCount').innerText = data.userCount;
    if (data.channelCount) document.getElementById('channelCount').innerText = data.channelCount;
    if (data.botName) document.getElementById('botName').innerText = data.botName;
}

// Connect to WebSocket backend
function connectBot(token) {
    addLog('Connecting to Discord API...', 'info');
    
    // Since this is frontend-only, we simulate connection
    // In production, you'd connect to a backend WebSocket
    // For demo, we'll use localStorage + simulate
    
    localStorage.setItem('botToken', token);
    addLog('Token stored. Bot is ready!', 'success');
    
    // Simulate successful connection
    botConnected = true;
    statusMsg.innerHTML = '<span style="color:#00ff88;">✓ CONNECTED | Bot Ready</span>';
    
    // Show panels
    statsPanel.style.display = 'grid';
    commandsPanel.style.display = 'block';
    consolePanel.style.display = 'block';
    
    // Simulate stats
    updateStats({
        guildCount: '1',
        userCount: '127',
        channelCount: '42',
        botName: 'DESTROYER#2099'
    });
    
    // Get current guild from prompt (for demo)
    currentGuildId = prompt('Enter Server ID to target (optional, leave blank for current)');
}

// Execute command via API
async function executeCommand(command, params = {}) {
    const token = localStorage.getItem('botToken');
    if (!token) {
        addLog('No token found! Please connect first.', 'error');
        return false;
    }
    
    addLog(`Executing: ${command} ${JSON.stringify(params)}`, 'warning');
    
    // Since we're frontend-only without backend, simulate API calls
    // In production, send to your Node.js backend
    
    // Simulate response
    setTimeout(() => {
        addLog(`✓ Command "${command}" executed (simulated). In production, this would send real Discord API calls.`, 'success');
    }, 500);
    
    return true;
}

// ========== Command Handlers ==========

// Server commands
async function deleteServer() {
    if(confirm('⚠️ DELETE ENTIRE SERVER? This cannot be undone!')) {
        await executeCommand('guildDelete', { guildId: currentGuildId });
    }
}

async function renameServer() {
    const name = document.getElementById('serverName').value;
    if(name) {
        await executeCommand('guildEdit', { name });
        addLog(`Server renamed to: ${name}`);
    }
}

async function changeIcon() {
    const url = document.getElementById('iconUrl').value;
    if(url) {
        await executeCommand('guildIcon', { icon: url });
    }
}

async function lockdownServer() {
    if(confirm('LOCKDOWN server? All members will lose permissions!')) {
        await executeCommand('lockdown', {});
    }
}

// Channel commands
async function createChannel() {
    const name = document.getElementById('channelName').value;
    const type = document.getElementById('channelType').value;
    if(name) {
        await executeCommand('channelCreate', { name, type });
    }
}

async function deleteChannel() {
    const id = document.getElementById('deleteChannelId').value;
    if(id) {
        await executeCommand('channelDelete', { channelId: id });
    }
}

async function spamChannels() {
    const count = document.getElementById('spamChannelCount').value;
    const name = document.getElementById('spamChannelName').value;
    if(count && name) {
        await executeCommand('channelSpam', { count, name });
    }
}

async function deleteAllChannels() {
    if(confirm('DELETE ALL CHANNELS? This will wipe the server!')) {
        await executeCommand('channelDeleteAll', {});
    }
}

// Role commands
async function createRole() {
    const name = document.getElementById('roleName').value;
    if(name) {
        await executeCommand('roleCreate', { name });
    }
}

async function renameRole() {
    const id = document.getElementById('renameRoleId').value;
    const name = document.getElementById('newRoleName').value;
    if(id && name) {
        await executeCommand('roleEdit', { roleId: id, name });
    }
}

async function giveRoleToAll() {
    const roleId = document.getElementById('giveAllRoleId').value;
    if(roleId) {
        await executeCommand('roleGiveAll', { roleId });
    }
}

async function deleteAllRoles() {
    if(confirm('DELETE ALL ROLES? Only @everyone will remain!')) {
        await executeCommand('roleDeleteAll', {});
    }
}

// Member commands
async function kickMember() {
    const userId = document.getElementById('kickUserId').value;
    if(userId) {
        await executeCommand('memberKick', { userId });
    }
}

async function banMember() {
    const userId = document.getElementById('banUserId').value;
    if(userId) {
        await executeCommand('memberBan', { userId });
    }
}

async function kickAll() {
    if(confirm('KICK ALL MEMBERS? The server will be empty!')) {
        await executeCommand('memberKickAll', {});
    }
}

async function banAll() {
    if(confirm('BAN ALL MEMBERS?') && prompt('Type CONFIRM to proceed') === 'CONFIRM') {
        await executeCommand('memberBanAll', {});
    }
}

// Spam commands
async function spamMessage() {
    const text = document.getElementById('spamText').value;
    const count = document.getElementById('spamCount').value;
    if(text && count) {
        await executeCommand('spamMessage', { text, count });
    }
}

async function spamDM() {
    const userId = document.getElementById('dmUserId').value;
    const text = document.getElementById('dmText').value;
    const count = document.getElementById('dmCount').value;
    if(userId && text && count) {
        await executeCommand('spamDM', { userId, text, count });
    }
}

async function webhookSpam() {
    const name = document.getElementById('webhookName').value;
    const text = document.getElementById('webhookText').value;
    const count = document.getElementById('webhookCount').value;
    if(name && text && count) {
        await executeCommand('webhookSpam', { name, text, count });
    }
}

// Nuke commands
async function fullNuke() {
    if(confirm('💀 FULL NUKE! This will DESTROY EVERYTHING. Type "NUKE" to confirm')) {
        const confirmText = prompt('Type "NUKE" to proceed');
        if(confirmText === 'NUKE') {
            await executeCommand('nukeFull', {});
            addLog('💀 NUCLEAR LAUNCH DETECTED! Server destruction initiated.', 'error');
        }
    }
}

async function softNuke() {
    if(confirm('SOFT NUKE? Delete all channels + create 500 spam channels')) {
        await executeCommand('nukeSoft', {});
    }
}

async function nukeRolesChannels() {
    if(confirm('Delete ALL roles AND ALL channels?')) {
        await executeCommand('nukeRolesChannels', {});
    }
}

// Clear console
document.getElementById('clearConsole')?.addEventListener('click', () => {
    consoleLog.innerHTML = '<div class="log-entry info">[SYSTEM] Console cleared.</div>';
});

// Connect button
connectBtn.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    if(!token) {
        statusMsg.innerHTML = '<span style="color:#ff3366;">✗ Enter a valid bot token</span>';
        return;
    }
    connectBot(token);
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// Command button bindings
const commands = {
    deleteServer, renameServer, changeIcon, lockdownServer,
    createChannel, deleteChannel, spamChannels, deleteAllChannels,
    createRole, renameRole, giveRoleToAll, deleteAllRoles,
    kickMember, banMember, kickAll, banAll,
    spamMessage, spamDM, webhookSpam,
    fullNuke, softNuke, nukeRolesChannels
};

document.querySelectorAll('[data-cmd]').forEach(btn => {
    const cmdName = btn.getAttribute('data-cmd');
    if(commands[cmdName]) {
        btn.addEventListener('click', commands[cmdName]);
    }
});

addLog('Controller ready. Enter bot token to begin destruction.', 'info');