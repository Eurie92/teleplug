import fs from 'fs';
import path from 'path';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
export const DEFAULT_CONFIG = {
    plugger: {
        enabled: false,
        intervalMinutes: 60, // 1 hour default
        intervalVariancePercent: 10,
        messageTemplate: '{Hey|Hello|Hi} everyone! 👋 Check out our latest updates here: https://example.com #promotion',
        minDelaySec: 20,
        maxDelaySec: 45,
        targetGroupIds: [],
    },
    forwarder: {
        enabled: false,
        routes: [],
    },
    credentials: {
        apiId: process.env.TELEGRAM_API_ID ? parseInt(process.env.TELEGRAM_API_ID, 10) : null,
        apiHash: process.env.TELEGRAM_API_HASH || null,
        phone: null,
        isAuthorized: false,
        userName: null,
        userId: null,
    },
};
export class ConfigStore {
    config;
    filePath;
    constructor(customFilePath) {
        this.filePath = customFilePath || CONFIG_FILE;
        this.ensureDataDir();
        this.config = this.loadConfig();
    }
    ensureDataDir() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, 'utf-8');
                const parsed = JSON.parse(raw);
                return {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    plugger: { ...DEFAULT_CONFIG.plugger, ...(parsed.plugger || {}) },
                    forwarder: { ...DEFAULT_CONFIG.forwarder, ...(parsed.forwarder || {}) },
                    credentials: { ...DEFAULT_CONFIG.credentials, ...(parsed.credentials || {}) },
                };
            }
        }
        catch (err) {
            console.error('[ConfigStore] Failed to load config, using defaults:', err);
        }
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    saveConfig() {
        try {
            this.ensureDataDir();
            fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('[ConfigStore] Failed to save config:', err);
        }
    }
    getConfig() {
        return this.config;
    }
    updatePlugger(settings) {
        this.config.plugger = { ...this.config.plugger, ...settings };
        this.saveConfig();
        return this.config.plugger;
    }
    updateForwarder(settings) {
        this.config.forwarder = { ...this.config.forwarder, ...settings };
        this.saveConfig();
        return this.config.forwarder;
    }
    updateCredentials(credentials) {
        this.config.credentials = { ...this.config.credentials, ...credentials };
        this.saveConfig();
        return this.config.credentials;
    }
}
export const configStore = new ConfigStore();
