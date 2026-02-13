// =================================================
// wallet.js — MetaMask接続共通モジュール
// =================================================

const Wallet = {
  _address: null,
  _chainId: null,
  _callbacks: { account: [], chain: [] },

  // MetaMaskがインストールされているか
  isAvailable() {
    return typeof window.ethereum !== 'undefined';
  },

  // 接続済みか
  isConnected() {
    return !!this._address;
  },

  // 現在のアドレス
  getAddress() {
    return this._address;
  },

  // 短縮アドレス表示（0x1234...5678）
  shortAddress(addr) {
    addr = addr || this._address;
    if (!addr) return '';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  },

  // MetaMask接続（ユーザー操作でポップアップ）
  async connect() {
    if (!this.isAvailable()) {
      throw new Error('MetaMaskがインストールされていません');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('ウォレット接続が拒否されました');
    }

    try { localStorage.removeItem('bizen:wallet:disconnected'); } catch {}
    this._address = accounts[0];
    this._chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
    this._setupListeners();

    return { address: this._address, chainId: this._chainId };
  },

  // 自動再接続（ポップアップなし、既に承認済みならつながる）
  async reconnect() {
    if (!this.isAvailable()) return null;

    // ユーザーが明示的に切断した場合は再接続しない
    try {
      if (localStorage.getItem('bizen:wallet:disconnected') === '1') return null;
    } catch {}

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) return null;

      this._address = accounts[0];
      this._chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
      this._setupListeners();

      return { address: this._address, chainId: this._chainId };
    } catch (e) {
      return null;
    }
  },

  // イベントリスナー設定（重複防止）
  _listenersSet: false,
  _setupListeners() {
    if (this._listenersSet) return;
    this._listenersSet = true;

    window.ethereum.on('accountsChanged', (accounts) => {
      this._address = accounts[0] || null;
      this._callbacks.account.forEach(cb => cb(this._address));
    });

    window.ethereum.on('chainChanged', (chainId) => {
      this._chainId = parseInt(chainId, 16);
      this._callbacks.chain.forEach(cb => cb(this._chainId));
    });
  },

  // 接続解除（状態クリア + 明示的切断フラグ）
  disconnect() {
    this._address = null;
    this._chainId = null;
    try { localStorage.setItem('bizen:wallet:disconnected', '1'); } catch {}
  },

  // Polygonチェーンであることを確認・切替
  async ensurePolygon() {
    const targetChainId = '0x' + CONFIG.chain.id.toString(16);

    if (this._chainId === CONFIG.chain.id) return true;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      return true;
    } catch (switchError) {
      // チェーンが未追加の場合、追加を試みる
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetChainId,
            chainName: CONFIG.chain.name,
            nativeCurrency: CONFIG.chain.currency,
            rpcUrls: [CONFIG.chain.rpc],
            blockExplorerUrls: [CONFIG.chain.explorer],
          }],
        });
        return true;
      }
      throw switchError;
    }
  },

  // コールバック登録
  onAccountChange(cb) { this._callbacks.account.push(cb); },
  onChainChange(cb) { this._callbacks.chain.push(cb); },
};
