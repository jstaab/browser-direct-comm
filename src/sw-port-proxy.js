const MSG_TYPES = {
    // register a particular window.
    registerWin: 'register-win',
    registerWinAck: 'register-win-ack',
    
    // get all windows ids registered.
    getWindows: 'get-windows',
    getWindowsRsp: 'get-windows-rsp',

    // send port to SharedWorker (which will fwd to dest)
    sendPort: 'send-port',
    sendPortFailed: 'send-port-failed',
    sendPortAck: 'send-port-ack',

    // fwd port from SharedWorker to dest
    receivePort: 'receive-port',
    receivePortAck: 'receive-port-ack',

    sendMsgAck: 'send-msg-ack',
    closeConnection: 'close-connection',
};

// key: windowId, value: port 
const windows = new Map();

onconnect = (e) => {
    if (!e || !e.ports || e.ports.length === 0) {
        return;
    }
    const port = e.ports[0];
    port.onmessage = (e) => {
        if (!e || !e.data) {
            return;
        }
        const msg = e.data.msg;
        const _msgId = e.data._msgId;
        if (!msg || !_msgId) {
            return;
        }

        if (msg === MSG_TYPES.registerWin && e.data.windowId) {
            windows.set(e.data.windowId, port);
            port.postMessage({
                msg: MSG_TYPES.registerWinAck,
                _msgId,
            });
            return;
        }

        if (msg === MSG_TYPES.getWindows) {
            const windowsAr = Array.from( windows.keys() );
            port.postMessage({
                msg: MSG_TYPES.getWindowsRsp,
                windowsAr,
                _msgId,
            });
            return;
        }

        if (msg === MSG_TYPES.sendPort && e.data.destWindowId && e.data.port && e.data.sourceWindowId) {
            if (windows.get(e.data.destWindowId)) {
                const destWindowPort = windows.get(e.data.destWindowId);
                destWindowPort.postMessage({
                    msg: MSG_TYPES.receivePort,
                    sourceWindowId: e.data.sourceWindowId,
                    port: e.data.port,
                    _msgId,
                }, [ e.data.port ]);
            } else {
                port.postMessage({
                    msg: MSG_TYPES.sendPortFailed,
                    _msgId,
                });
            }
            return;
        }

        if (msg === MSG_TYPES.receivePortAck && e.data.sourceWindowId) {
            if (windows.get(e.data.sourceWindowId)) {
                const sourceWindowPort = windows.get(e.data.sourceWindowId);
                sourceWindowPort.postMessage({
                    msg: MSG_TYPES.sendPortAck,
                    _msgId,
                });
            }
        }
    }
}