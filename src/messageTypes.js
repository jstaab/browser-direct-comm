export const MSG_TYPES = {
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
}