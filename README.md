# Direct communication between renderer processes

This library is work in progress...

# Problem trying to solve with this library
Currently electron renderer processes (e.g., those created by BrowserWindow) can not directly communicate.  They can only communicate via the main process using (ipcRenderer: https://github.com/electron/electron/blob/master/docs/api/ipc-renderer.md). Additionally ipcRenderer does not support transferables (https://developer.mozilla.org/en-US/docs/Web/API/Transferable).

# Solution
This library allows direct communication between electron renderer processes without involving the main process. The library uses a SharedWorker to pass a MessagePort between BrowserWindows. Once the MessagePort is transferred to the other BrowserWindow then direct communication is possible using postMessage. Additionally, postMessage from MessagePort supports Transerables, so for example ArrayBuffers can be efficiently transferred. 

Note: in order to support SharedWorker the BrowserWindows must be running on the same origin (as described in the SharedWorker docs: https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker).  So BrowserWindows opened from local file system or using file:/// will not work with this library.  The BrowserWinow Url must be using https on the same origin.

# Example Use Case
To support Comlink (see: https://github.com/GoogleChromeLabs/comlink) communication between renderer processes a MessagePort is needed. With this library is possible for one BrowserWindow to create MessageChannel and pass one of the ports to a another BrowserWindow, then use Comlink to expose objects/classes directly between the BrowserWindows.


# API
To be provided.
