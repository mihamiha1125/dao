// =================================================
// manager.js — Manager コントラクト操作共通モジュール
// config.js, wallet.js 必須
// =================================================

const Manager = {
  // Read用コントラクト（RPC直接）
  _readContract: null,
  getReadContract() {
    if (!this._readContract) {
      const web3 = NFTHelper.getWeb3();
      this._readContract = new web3.eth.Contract(ABI.Manager, CONFIG.contracts.manager.address);
    }
    return this._readContract;
  },

  // Write用コントラクト（MetaMask経由）
  async getWriteContract() {
    const web3 = new Web3(window.ethereum);
    return new web3.eth.Contract(ABI.Manager, CONFIG.contracts.manager.address);
  },

  // ── Read ──

  // ユーザー種別: "admin" | "creator" | "user" | "none"
  async checkUser() {
    try {
      const contract = await this.getWriteContract();
      const result = await contract.methods.checkUser().call({ from: Wallet.getAddress() });
      return result || 'none';
    } catch (e) {
      console.warn('checkUser error:', e);
      return 'none';
    }
  },

  // Admin一覧
  async getAdmins() {
    try {
      const contract = this.getReadContract();
      const result = await contract.methods.getAdmins().call();
      return result[0] || [];
    } catch (e) {
      console.error('getAdmins error:', e);
      return [];
    }
  },

  // コントラクト一覧 → [{address, name, type, visible}]
  async getAllContracts() {
    try {
      const contract = this.getReadContract();
      const result = await contract.methods.getAllContracts().call();
      const list = [];
      for (let i = 0; i < result[0].length; i++) {
        list.push({
          address: result[0][i],
          name: result[1][i],
          type: result[2][i],
          visible: result[3][i],
        });
      }
      return list;
    } catch (e) {
      console.error('getAllContracts error:', e);
      return [];
    }
  },

  // 作家一覧 → [{address, name, type, visible}]
  async getAllCreators() {
    try {
      const contract = this.getReadContract();
      const result = await contract.methods.getAllCreators().call();
      const list = [];
      for (let i = 0; i < result[0].length; i++) {
        list.push({
          address: result[0][i],
          name: result[1][i],
          type: result[2][i],
          visible: result[3][i],
        });
      }
      return list;
    } catch (e) {
      console.error('getAllCreators error:', e);
      return [];
    }
  },

  // ── Write (tx) ──

  async sendTx(methodName, args) {
    const contract = await this.getWriteContract();
    const from = Wallet.getAddress();
    return contract.methods[methodName](...args).send({ from });
  },

  // Admin
  async setAdmin(address) { return this.sendTx('setAdmin', [address]); },
  async delAdmin(address) { return this.sendTx('delAdmin', [address]); },

  // Creator
  async setCreator(address, name, type) { return this.sendTx('setCreator', [address, name, type]); },
  async setCreatorInfo(address, name, type) { return this.sendTx('setCreatorInfo', [address, name, type]); },
  async delCreator(address) { return this.sendTx('delCreator', [address]); },
  async hiddenCreator(address) { return this.sendTx('hiddenCreator', [address]); },
  async publicCreator(address) { return this.sendTx('publicCreator', [address]); },

  // Contract
  async setContract(address, name, type) { return this.sendTx('setContract', [address, name, type]); },
  async setContractInfo(address, name, type) { return this.sendTx('setContractInfo', [address, name, type]); },
  async deleteContract(address) { return this.sendTx('deleteContract', [address]); },
  async hiddenContract(address) { return this.sendTx('hiddenContract', [address]); },
  async publicContract(address) { return this.sendTx('publicContract', [address]); },
};
