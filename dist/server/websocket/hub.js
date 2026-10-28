import { WebSocket } from 'ws';
export class LogHub {
    wss = null;
    recentLogs = [];
    maxLogs = 200;
    setServer(wss) {
        this.wss = wss;
        this.wss.on('connection', (ws) => {
            // Send historical logs to newly connected client
            ws.send(JSON.stringify({ type: 'history', logs: this.recentLogs }));
        });
    }
    emit(level, category, text, details) {
        const logItem = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level,
            category,
            text,
            details,
        };
        this.recentLogs.push(logItem);
        if (this.recentLogs.length > this.maxLogs) {
            this.recentLogs.shift();
        }
        const payload = JSON.stringify({ type: 'log', log: logItem });
        if (this.wss) {
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                }
            });
        }
        const prefix = `[${logItem.timestamp}] [${category.toUpperCase()}]`;
        if (level === 'error') {
            console.error(prefix, text, details || '');
        }
        else if (level === 'warn') {
            console.warn(prefix, text, details || '');
        }
        else {
            console.log(prefix, text, details || '');
        }
    }
    broadcast(type, data) {
        if (this.wss) {
            const payload = JSON.stringify({ type, data });
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                }
            });
        }
    }
    info(category, text, details) {
        this.emit('info', category, text, details);
    }
    success(category, text, details) {
        this.emit('success', category, text, details);
    }
    warn(category, text, details) {
        this.emit('warn', category, text, details);
    }
    error(category, text, details) {
        this.emit('error', category, text, details);
    }
    getHistory() {
        return this.recentLogs;
    }
}
export const logHub = new LogHub();
