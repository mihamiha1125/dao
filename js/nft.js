// =================================================
// nft.js — NFT/TBA取得ロジック共通モジュール
// Web3.jsに依存（config.js, cache.js も必須）
// =================================================

const NFTHelper = {
  _web3: null,

  // Web3インスタンス取得（遅延初期化）
  getWeb3() {
    if (!this._web3) {
      this._web3 = new Web3(CONFIG.chain.rpc);
    }
    return this._web3;
  },

  // コントラクトインスタンス生成
  getContract(address, abi) {
    return new (this.getWeb3()).eth.Contract(abi || ABI.ERC721Full, address);
  },

  // ── NFT基本情報 ──

  // コントラクト情報取得（キャッシュ付き）
  async getContractInfo(address) {
    const cached = Cache.getContractInfo(address);
    if (cached) return cached;

    const contract = this.getContract(address);
    try {
      const [name, symbol, totalSupply] = await Promise.all([
        contract.methods.name().call(),
        contract.methods.symbol().call(),
        contract.methods.totalSupply().call(),
      ]);
      const result = { name, symbol, totalSupply: parseInt(totalSupply) };
      Cache.setContractInfo(address, result);
      return result;
    } catch (e) {
      console.error('getContractInfo error:', e);
      return { name: 'Unknown', symbol: '???', totalSupply: 0 };
    }
  },

  // 特定オーナーの所有トークンID一覧（キャッシュ付き）
  async getOwnedTokenIds(contractAddress, ownerAddress) {
    const cached = Cache.getOwned(contractAddress, ownerAddress);
    if (cached) return cached;

    const contract = this.getContract(contractAddress);
    try {
      const balance = parseInt(await contract.methods.balanceOf(ownerAddress).call());
      if (balance === 0) {
        Cache.setOwned(contractAddress, ownerAddress, []);
        return [];
      }

      const promises = [];
      for (let i = 0; i < balance; i++) {
        promises.push(contract.methods.tokenOfOwnerByIndex(ownerAddress, i).call());
      }
      const results = await Promise.allSettled(promises);
      const tokenIds = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.toString());
      Cache.setOwned(contractAddress, ownerAddress, tokenIds);
      return tokenIds;
    } catch (e) {
      console.error('getOwnedTokenIds error:', e);
      return [];
    }
  },

  // トークンメタデータ取得（キャッシュ + リトライ付き）
  async getTokenMetadata(contractAddress, tokenId, retries = 3) {
    // キャッシュチェック
    const cached = Cache.getNft(contractAddress, tokenId);
    if (cached) return cached;

    const contract = this.getContract(contractAddress);
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const uri = await contract.methods.tokenURI(tokenId).call();
        const resolvedUri = this.resolveUri(uri);
        const response = await fetch(resolvedUri);
        const metadata = await response.json();

        const result = {
          tokenId: tokenId.toString(),
          name: metadata.name || 'NFT',
          description: metadata.description || '',
          image: this.resolveUri(metadata.image || ''),
          animation_url: metadata.animation_url ? this.resolveUri(metadata.animation_url) : '',
          external_url: metadata.external_url || '',
          attributes: metadata.attributes || [],
          rawUri: uri,
        };

        // キャッシュ保存（immutableなので永続）
        Cache.setNft(contractAddress, tokenId, result);
        return result;
      } catch (e) {
        if (attempt < retries - 1 && e.message && e.message.includes('rate limit')) {
          console.warn(`Rate limited (tokenId=${tokenId}), retry in ${(attempt + 1) * 3}s...`);
          await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
        } else {
          console.error(`getTokenMetadata error (tokenId=${tokenId}):`, e);
          return null;
        }
      }
    }
    return null;
  },

  // ── TBA (ERC-6551) ──

  // NFTのTBAアドレスを算出（deterministic → 永続キャッシュ）
  async getTbaAddress(tokenContract, tokenId) {
    const cached = Cache.getTba(tokenContract, tokenId);
    if (cached) return cached;

    const registry = new (this.getWeb3()).eth.Contract(
      ABI.ERC6551Registry,
      CONFIG.contracts.tba.registry
    );
    try {
      const tbaAddress = await registry.methods.account(
        CONFIG.contracts.tba.implementation,
        CONFIG.chain.id,
        tokenContract,
        tokenId,
        CONFIG.contracts.tba.salt
      ).call();
      Cache.setTba(tokenContract, tokenId, tbaAddress);
      return tbaAddress;
    } catch (e) {
      console.error('getTbaAddress error:', e);
      return null;
    }
  },

  // TBAが所有する全アセット（NFT + SBT）を取得
  async getTbaAssets(tbaAddress) {
    const targets = CONFIG.tbaTargets;
    const results = [];

    // 全コントラクトに並列で balanceOf
    const balancePromises = targets.map(async (target) => {
      const tokenIds = await this.getOwnedTokenIds(target.address, tbaAddress);
      return { target, tokenIds };
    });

    const balances = await Promise.allSettled(balancePromises);

    // メタデータ取得（所有があるもののみ）
    const metadataPromises = [];
    for (const result of balances) {
      if (result.status !== 'fulfilled') continue;
      const { target, tokenIds } = result.value;
      for (const tokenId of tokenIds) {
        metadataPromises.push(
          this.getTokenMetadata(target.address, tokenId).then(metadata => ({
            contractAddress: target.address,
            artistKey: target.key,
            artistName: target.name,
            type: target.type,
            tokenId,
            metadata,
          }))
        );
      }
    }

    const metadataResults = await Promise.allSettled(metadataPromises);
    for (const r of metadataResults) {
      if (r.status === 'fulfilled' && r.value.metadata) {
        results.push(r.value);
      }
    }

    return results;
  },

  // ── ユーティリティ ──

  // IPFS/ArweaveのURI解決
  resolveUri(uri) {
    if (!uri) return '';
    if (uri.startsWith('ipfs://')) {
      return CONFIG.gateways.ipfs + uri.slice(7);
    }
    if (uri.startsWith('ar://')) {
      return CONFIG.gateways.arweave + uri.slice(5);
    }
    return uri;
  },

  // Polygonscan Token URL
  polygonscanTokenUrl(contractAddress, tokenId) {
    return `${CONFIG.chain.explorer}/token/${contractAddress}?a=${tokenId}`;
  },

  // Polygonscan Address URL
  polygonscanAddressUrl(address) {
    return `${CONFIG.chain.explorer}/address/${address}`;
  },
};
