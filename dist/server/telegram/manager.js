import path from 'path';
import { TelegramClient } from '@mtcute/node';
import { Dispatcher } from '@mtcute/dispatcher';
import { configStore } from '../store/configStore.js';
import { logHub } from '../websocket/hub.js';
import { parseSpintax } from '../utils/spintax.js';
import { getRandomDelay, getJitteredInterval, sleep } from '../utils/jitter.js';
export class TelegramManager {
    client = null;
    dp = null;
    isPluggerRunning = false;
    isForwarderRunning = false;
    pluggerAbortController = null;
    cachedDialogs = [];
    constructor() {
        this.tryAutoConnect();
    }
    async tryAutoConnect() {
        const config = configStore.getConfig();
        if (config.credentials.apiId && config.credentials.apiHash) {
            try {
                await this.initClient(config.credentials.apiId, config.credentials.apiHash);
                const isAuth = await this.checkAuthStatus();
                if (isAuth) {
                    logHub.success('auth', `Auto-authenticated as @${config.credentials.userName || 'user'}`);
                    if (config.plugger.enabled) {
                        this.startPlugger();
                    }
                    if (config.forwarder.enabled) {
                        this.startForwarder();
                    }
                }
            }
            catch (err) {
                logHub.warn('auth', 'Initial Telegram session auto-connect failed or session expired.');
            }
        }
    }
    async initClient(apiId, apiHash) {
        if (this.client) {
            try {
                await this.client.close();
            }
            catch {
                // ignore
            }
        }
        const sessionPath = path.resolve(process.cwd(), 'data', 'tg-session');
        this.client = new TelegramClient({
            apiId,
            apiHash,
            storage: sessionPath,
        });
        this.dp = Dispatcher.for(this.client);
        this.setupDispatcher();
        return this.client;
    }
    async sendCode(phone) {
        const config = configStore.getConfig();
        if (!config.credentials.apiId || !config.credentials.apiHash) {
            throw new Error('Telegram API ID and API Hash must be set first.');
        }
        if (!this.client) {
            await this.initClient(config.credentials.apiId, config.credentials.apiHash);
        }
        logHub.info('auth', `Requesting OTP code for ${phone}...`);
        const res = await this.client.sendCode({ phone });
        logHub.success('auth', `OTP code sent successfully to ${phone}`);
        return { phoneCodeHash: res.phoneCodeHash };
    }
    async signIn(phone, code, phoneCodeHash) {
        if (!this.client)
            throw new Error('Client not initialized');
        logHub.info('auth', `Signing in with code for ${phone}...`);
        try {
            const user = await this.client.signIn({
                phone,
                phoneCode: code,
                phoneCodeHash,
            });
            configStore.updateCredentials({
                phone,
                isAuthorized: true,
                userId: user.id,
                userName: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            });
            logHub.success('auth', `Logged in successfully as ${user.displayName || user.username}!`);
            return true;
        }
        catch (err) {
            logHub.error('auth', 'Sign-in failed', { error: String(err) });
            throw err;
        }
    }
    async checkPassword(password) {
        if (!this.client)
            throw new Error('Client not initialized');
        try {
            const user = await this.client.checkPassword(password);
            configStore.updateCredentials({
                isAuthorized: true,
                userId: user.id,
                userName: user.username || user.displayName || 'User',
            });
            logHub.success('auth', '2FA password accepted! Logged in successfully.');
            return true;
        }
        catch (err) {
            logHub.error('auth', 'Invalid 2FA password', { error: String(err) });
            throw err;
        }
    }
    async checkAuthStatus() {
        if (!this.client)
            return false;
        try {
            const me = await this.client.getMe();
            if (me) {
                configStore.updateCredentials({
                    isAuthorized: true,
                    userId: me.id,
                    userName: me.username || me.displayName || 'User',
                });
                return true;
            }
        }
        catch {
            // not authorized
        }
        configStore.updateCredentials({ isAuthorized: false });
        return false;
    }
    async logout() {
        this.stopPlugger();
        this.stopForwarder();
        if (this.client) {
            try {
                await this.client.logOut();
            }
            catch {
                // ignore
            }
            this.client = null;
        }
        configStore.updateCredentials({
            isAuthorized: false,
            userId: null,
            userName: null,
            phone: null,
        });
        logHub.info('auth', 'Logged out of Telegram session.');
    }
    async fetchDialogs() {
        if (!this.client)
            throw new Error('Client not initialized');
        const isAuth = await this.checkAuthStatus();
        if (!isAuth)
            throw new Error('Account not authorized');
        logHub.info('system', 'Scanning joined Telegram dialogs...');
        const groups = [];
        const config = configStore.getConfig();
        const targetSet = new Set(config.plugger.targetGroupIds);
        try {
            for await (const dialog of this.client.iterDialogs()) {
                const peer = dialog.peer;
                if ('isGroup' in peer && (peer.isGroup || peer.chatType === 'channel' || peer.chatType === 'supergroup')) {
                    const canSend = peer.permissions ? (peer.permissions.canSendMessages ?? true) : true;
                    const groupItem = {
                        id: String(peer.id),
                        title: peer.title || 'Untitled',
                        username: peer.username || undefined,
                        type: peer.chatType === 'channel' ? 'channel' : 'group',
                        canSendMessages: canSend,
                        isTarget: targetSet.has(String(peer.id)),
                    };
                    groups.push(groupItem);
                }
            }
            this.cachedDialogs = groups;
            logHub.success('system', `Found ${groups.length} groups/channels (${groups.filter(g => g.canSendMessages).length} writable).`);
            return groups;
        }
        catch (err) {
            logHub.error('system', 'Failed to scan dialogs', { error: String(err) });
            return this.cachedDialogs;
        }
    }
    getCachedDialogs() {
        return this.cachedDialogs;
    }
    // --- Auto-Plugger Broadcaster ---
    startPlugger() {
        if (this.isPluggerRunning)
            return;
        this.isPluggerRunning = true;
        configStore.updatePlugger({ enabled: true });
        this.pluggerAbortController = new AbortController();
        logHub.info('plugger', '🚀 Auto-Plugger started!');
        this.runPluggerLoop(this.pluggerAbortController.signal);
    }
    stopPlugger() {
        if (!this.isPluggerRunning)
            return;
        this.isPluggerRunning = false;
        configStore.updatePlugger({ enabled: false });
        if (this.pluggerAbortController) {
            this.pluggerAbortController.abort();
            this.pluggerAbortController = null;
        }
        logHub.info('plugger', '⏹️ Auto-Plugger stopped.');
    }
    async runPluggerLoop(signal) {
        while (this.isPluggerRunning && !signal.aborted) {
            const config = configStore.getConfig();
            const targetIds = config.plugger.targetGroupIds;
            if (targetIds.length === 0) {
                logHub.warn('plugger', 'No target groups selected for auto-plugging! Pausing loop.');
                this.stopPlugger();
                break;
            }
            logHub.info('plugger', `Starting broadcast cycle across ${targetIds.length} target groups...`);
            for (let i = 0; i < targetIds.length; i++) {
                if (!this.isPluggerRunning || signal.aborted)
                    break;
                const groupId = targetIds[i];
                const groupInfo = this.cachedDialogs.find(g => g.id === groupId);
                const groupTitle = groupInfo?.title || `Chat ${groupId}`;
                try {
                    const spintaxMessage = parseSpintax(config.plugger.messageTemplate, {
                        group_name: groupTitle,
                    });
                    if (this.client) {
                        await this.client.sendText(Number(groupId) || groupId, spintaxMessage);
                        logHub.success('plugger', `[${i + 1}/${targetIds.length}] Sent plug to "${groupTitle}"`);
                    }
                }
                catch (err) {
                    const errStr = String(err);
                    if (errStr.includes('FLOOD_WAIT')) {
                        const match = errStr.match(/FLOOD_WAIT_(\d+)/i);
                        const waitSeconds = match ? parseInt(match[1], 10) : 60;
                        logHub.warn('plugger', `⚠️ Telegram FLOOD_WAIT triggered! Backing off for ${waitSeconds}s...`);
                        await sleep((waitSeconds + 5) * 1000);
                    }
                    else {
                        logHub.error('plugger', `Failed to send to "${groupTitle}"`, { error: errStr });
                    }
                }
                // Inter-group humanized jitter delay
                if (i < targetIds.length - 1 && this.isPluggerRunning && !signal.aborted) {
                    const delayMs = getRandomDelay(config.plugger.minDelaySec, config.plugger.maxDelaySec);
                    logHub.info('plugger', `Sleeping ${(delayMs / 1000).toFixed(1)}s before next group (anti-spam jitter)...`);
                    await sleep(delayMs);
                }
            }
            if (!this.isPluggerRunning || signal.aborted)
                break;
            // Cycle completion & interval calculation
            const nextCycleMs = getJitteredInterval(config.plugger.intervalMinutes, config.plugger.intervalVariancePercent);
            const nextCycleMin = (nextCycleMs / 60000).toFixed(1);
            logHub.info('plugger', `Cycle completed. Next broadcast scheduled in ~${nextCycleMin} minutes.`);
            await sleep(nextCycleMs);
        }
    }
    // --- Auto-Forwarder Engine ---
    setupDispatcher() {
        if (!this.dp)
            return;
        this.dp.onNewMessage(async (msg) => {
            if (!this.isForwarderRunning)
                return;
            const config = configStore.getConfig();
            const routes = config.forwarder.routes.filter(r => r.enabled);
            if (routes.length === 0)
                return;
            const sourceId = String(msg.chat.id);
            const sourceUsername = msg.chat.username?.toLowerCase();
            for (const route of routes) {
                const matchesSource = route.sourceChatId === sourceId ||
                    (sourceUsername && route.sourceChatId.replace('@', '').toLowerCase() === sourceUsername);
                if (!matchesSource)
                    continue;
                const text = msg.text || '';
                // Keyword Whitelist filter
                if (route.keywords && route.keywords.length > 0) {
                    const hasKeyword = route.keywords.some(k => text.toLowerCase().includes(k.toLowerCase().trim()));
                    if (!hasKeyword)
                        continue;
                }
                // Keyword Blacklist filter
                if (route.excludeKeywords && route.excludeKeywords.length > 0) {
                    const hasBlocked = route.excludeKeywords.some(k => text.toLowerCase().includes(k.toLowerCase().trim()));
                    if (hasBlocked)
                        continue;
                }
                try {
                    const targetPeer = Number(route.targetChatId) || route.targetChatId;
                    if (route.cleanCopy) {
                        // Post as a clean message without 'Forwarded from' header
                        let contentToSend = text;
                        if (route.customFooter) {
                            contentToSend = `${contentToSend}\n\n${route.customFooter}`;
                        }
                        if (this.client) {
                            await this.client.sendText(targetPeer, contentToSend);
                            logHub.success('forwarder', `Mirrored clean message from ${sourceId} -> ${route.targetChatId}`);
                        }
                    }
                    else {
                        // Native Telegram forward
                        if (this.client) {
                            await this.client.forwardMessages({
                                toChatId: targetPeer,
                                messages: [msg],
                            });
                            logHub.success('forwarder', `Forwarded post from ${sourceId} -> ${route.targetChatId}`);
                        }
                    }
                }
                catch (err) {
                    logHub.error('forwarder', `Forward route [${route.name}] failed`, { error: String(err) });
                }
            }
        });
    }
    startForwarder() {
        this.isForwarderRunning = true;
        configStore.updateForwarder({ enabled: true });
        logHub.info('forwarder', '📡 Message forwarder listener activated.');
    }
    stopForwarder() {
        this.isForwarderRunning = false;
        configStore.updateForwarder({ enabled: false });
        logHub.info('forwarder', '⏹️ Message forwarder listener paused.');
    }
    getStatus() {
        const config = configStore.getConfig();
        return {
            isAuthorized: config.credentials.isAuthorized,
            userName: config.credentials.userName,
            userId: config.credentials.userId,
            isPluggerRunning: this.isPluggerRunning,
            isForwarderRunning: this.isForwarderRunning,
            activeTargetsCount: config.plugger.targetGroupIds.length,
            activeRoutesCount: config.forwarder.routes.filter(r => r.enabled).length,
        };
    }
}
export const telegramManager = new TelegramManager();
