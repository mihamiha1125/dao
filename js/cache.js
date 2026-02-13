// =================================================
// cache.js — localStorage キャッシュ共通モジュール
// config.js 必須
// =================================================

const Cache = {
  PREFIX: 'bizen:',

  // ── キー生成 ──

  nftKey(contractAddress, tokenId) {
    return `${this.PREFIX}nft:${contractAddress.toLowerCase()}:${tokenId}`;
  },

  contractInfoKey(contractAddress) {
    return `${this.PREFIX}contract:${contractAddress.toLowerCase()}`;
  },

  tbaKey(tokenContract, tokenId) {
    return `${this.PREFIX}tba:${tokenContract.toLowerCase()}:${tokenId}`;
  },

  ownedKey(contractAddress, ownerAddress) {
    return `${this.PREFIX}owned:${contractAddress.toLowerCase()}:${ownerAddress.toLowerCase()}`;
  },

  // ── 汎用 get/set/remove ──

  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw);

      // TTL チェック（ttl未設定 = 永続）
      if (entry._expires && Date.now() > entry._expires) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  /**
   * @param {string} key
   * @param {*} data
   * @param {number|null} ttlMs - null = 永続（immutable データ向け）
   */
  set(key, data, ttlMs) {
    try {
      const entry = { data };
      if (ttlMs) {
        entry._expires = Date.now() + ttlMs;
      }
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // localStorage full — ignore
    }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  },

  // ── 便利メソッド ──

  // NFTメタデータ（immutable → 永続キャッシュ）
  getNft(contractAddress, tokenId) {
    return this.get(this.nftKey(contractAddress, tokenId));
  },

  setNft(contractAddress, tokenId, metadata) {
    this.set(this.nftKey(contractAddress, tokenId), metadata, null);
  },

  // コントラクト情報（totalSupply変動あり → 5分TTL）
  getContractInfo(contractAddress) {
    return this.get(this.contractInfoKey(contractAddress));
  },

  setContractInfo(contractAddress, info) {
    this.set(this.contractInfoKey(contractAddress), info, 5 * 60 * 1000);
  },

  // TBAアドレス（deterministic → 永続）
  getTba(tokenContract, tokenId) {
    return this.get(this.tbaKey(tokenContract, tokenId));
  },

  setTba(tokenContract, tokenId, address) {
    this.set(this.tbaKey(tokenContract, tokenId), address, null);
  },

  // 所有トークン一覧（変動あり → 2分TTL）
  getOwned(contractAddress, ownerAddress) {
    return this.get(this.ownedKey(contractAddress, ownerAddress));
  },

  setOwned(contractAddress, ownerAddress, tokenIds) {
    this.set(this.ownedKey(contractAddress, ownerAddress), tokenIds, 2 * 60 * 1000);
  },

  // 全キャッシュクリア（bizen:プレフィックスのみ）
  clearAll() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    return keys.length;
  },
};
