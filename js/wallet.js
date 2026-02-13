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

  // MetaMask接続
  async connect() {
    if (!this.isAvailable()) {
      throw new Error('MetaMaskがインストールされていません');
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('ウォレット接続が拒否されました');
    }

    this._address = accounts[0];
    this._chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);

    // イベントリスナー設定
    window.ethereum.on('accountsChanged', (accounts) => {
      this._address = accounts[0] || null;
      this._callbacks.account.forEach(cb => cb(this._address));
    });

    window.ethereum.on('chainChanged', (chainId) => {
      this._chainId = parseInt(chainId, 16);
      this._callbacks.chain.forEach(cb => cb(this._chainId));
    });

    return { address: this._address, chainId: this._chainId };
  },

  // 接続解除（状態クリアのみ、MetaMask側は操作しない）
  disconnect() {
    this._address = null;
    this._chainId = null;
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
