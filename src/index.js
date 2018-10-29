import { MSG_TYPES } from './messageTypes.js';

const sharedWorker = new SharedWorker('./sw-port-proxy.js');
const connections = new Map();

let nextMsgId = 1;
let myWindowId;
let receivedMsgCallback;

sharedWorker.onerror = function(e) {
    console.log('error from shared worker...', e);
}
sharedWorker.port.addEventListener('message', (e) => {
    if (e.data && e.data.msg === MSG_TYPES.receivePort && e.data.port && e.data.sourceWindowId) {
        const port = e.data.port;
        const sourceWindowId = e.data.sourceWindowId;
        connections.set(sourceWindowId, { myPort: port, remotePort: null });
        listenOnPortForReceivedMsgs(port, sourceWindowId);
        sharedWorker.port.postMessage({
            msg: MSG_TYPES.receivePortAck,
            sourceWindowId: sourceWindowId,
            _msgId: e.data._msgId,
        });
    }
});
sharedWorker.port.start();

function listenOnPortForReceivedMsgs(port, sourceWindowId) {
    if (port && typeof receivedMsgCallback === 'function') {
        port.onmessage = function(e) {
            if (e.data.msg === MSG_TYPES.sendMsgAck) {
                return;
            }
            if (e.data.msg === MSG_TYPES.closeConnection) {
                connections.delete(sourceWindowId);
                port.close();
                port.onmessage = null;
                return;
            }
            port.postMessage({ msg: MSG_TYPES.sendMsgAck, _msgId: e.data._msgId });
            receivedMsgCallback(sourceWindowId, e.data);
        }
    }
}

function getMsgId() {
    const msgId = nextMsgId;
    nextMsgId++;
    return msgId;
}

function sendMsgToPort(port, msgToSend, transferList = []) {
    return new Promise((resolve, reject) => {
        const msgId = getMsgId();
        function disconnect() {
            clearTimeout(timerId);
            port.removeEventListener('message', handler);
        }
        const timerId = setTimeout(() => {
            disconnect();
            reject('timeout');
        }, 10000);
        const handler = (e) => {
            if (e.data && e.data._msgId === msgId) {
                disconnect();
                resolve(e.data);
            }
        }
        port.addEventListener('message', handler);
        msgToSend._msgId = msgId;
        port.postMessage(msgToSend, transferList);
    });
}

// register a callback when a msg is received from a remote window.
// callback args:
//  - windowId: id of remote window that sent us a message.
//  - data: msg object from remote window.
export function listenForMessage(callback) {
    receivedMsgCallback = callback;
}

// this must be called first before a connection can be opened.
export async function registerWindow(windowId) {
    myWindowId = windowId;
    await sendMsgToPort(sharedWorker.port, {
        msg: MSG_TYPES.registerWin,
        windowId,
    });
}

// returns promise that resolves to array of registered windows ids.
export async function getWindows() {
    const rsp = await sendMsgToPort(sharedWorker.port, {
        msg: MSG_TYPES.getWindows,
    });
    if (rsp && rsp.msg === MSG_TYPES.getWindowsRsp && Array.isArray(rsp.windowsAr) ) {
        return rsp.windowsAr;
    }
    // no registered windows.
    return [];
}

export async function openConnection(destWindowId) {
    if (!myWindowId) {
        throw new Error('Window has not registered yet, registerWindow must be called first.');
    }
    
    if (connections.has(destWindowId)) {
        throw new Error('Connection already exists to window id: ' + destWindowId);
    }

    const channel = new MessageChannel();
    const myPort = channel.port1;
    const remotePort = channel.port2;

    const rsp = await sendMsgToPort(sharedWorker.port, {
        msg: MSG_TYPES.sendPort,
        destWindowId,
        sourceWindowId: myWindowId,
        port: remotePort,
    }, [ remotePort ]);
    
    if (rsp && rsp.msg === MSG_TYPES.sendPortAck) {
        connections.set(destWindowId, { myPort, remotePort });
        listenOnPortForReceivedMsgs(myPort, destWindowId);
        return;
    }

    throw new Error('Failed to open connection to window id:' + windowId);
}

export async function sendMessage(destWindowId, message, transferList = []) {
    if (!connections.has(destWindowId)) {
        throw new Error('No connection to window with id exists: ', destWindowId);
    }
    const { myPort } = connections.get(destWindowId);
    if (!myPort) {
        throw new Error('No port exists to communicate with window id: ' + destWindowId);
    }
    const rsp = await sendMsgToPort(myPort, message, transferList);
    if (!rsp || rsp.msg !== MSG_TYPES.sendMsgAck) {
        throw new Error('Ack for send message not received');
    }
}

// only owner (i.e., person creating connection) can close.
export function closeConnection(destWindowId) {
    if (connections.has(destWindowId)) {
        const { myPort, remotePort } = connections.get(destWindowId);
        if (myPort && remotePort) {
            myPort.postMessage({ msg: MSG_TYPES.closeConnection });
            myPort.close();
            remotePort.close();
            myPort.onmessage = null;
            remotePort.onmessage = null;
            connections.delete(destWindowId);
        }
    }
}



