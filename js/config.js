// =================================================
// config.js — BizenDAO 設定一元管理
// コントラクト追加・RPC変更はここだけ触ればOK
// =================================================

const CONFIG = {
  // ── ネットワーク ──
  chain: {
    id: 137,
    name: 'Polygon Mainnet',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },

  // ── ゲートウェイ ──
  gateways: {
    ipfs: 'https://ipfs.io/ipfs/',
    arweave: 'https://arweave.net/',
  },

  // ── コントラクト ──
  contracts: {
    // 作家NFT（ERC-721 Enumerable）
    nfts: [
      { key: 'mori-toshiaki', name: '森 敏彰', address: '0x4D0Abc6272E1288A177EA8E3076d4aFe2DB9C658' },
      { key: 'mori-taiga',    name: '森 大雅', address: '0x3DAC002d33A0c6F1c1684783DDaA78E5f29F14cc' },
      { key: 'hozangama',     name: '宝山窯',  address: '0xd84d7A7FE688a1CC40a931cab2aaF189eB3ceEcB' },
      { key: 'fujita-syo',    name: '藤田 祥', address: '0x6C8b4094809CE7e5Ec1a44F7553Cf51b969C2aEb' },
    ],

    // SBT — 箱書き・メンバーシップ（non-transferable）
    sbt: {
      address: '0xFcC45d28E7e51Cff6d8181Bd73023d46daf1fEd2',
    },

    // TBA（ERC-6551 v0.2.0 Token Bound Account）
    tba: {
      registry:       '0x63c8A3536E4A647D48fC0076D442e3243f7e773b',
      implementation: '0xa8a05744C04c7AD0D31Fcee368aC18040832F1c1',
      salt: 1,
    },

    // Manager（admin/creator/contract管理）
    manager: {
      address: '0x39615ac8f231D0099114eaC3095431e210C8f654',
    },

    // 寄付先
    donation: {
      address: '0x94280C465Be5C49B02b779Fd02d344815cb937d6',
      presets: [1, 5, 10, 50],
    },
  },

  // TBAスキャン対象（NFT全コントラクト + SBT）
  get tbaTargets() {
    return [
      ...this.contracts.nfts.map(n => ({ ...n, type: 'nft' })),
      { key: 'sbt', name: 'BizenDAO SBT', address: this.contracts.sbt.address, type: 'sbt' },
    ];
  },

  // アドレスから作家名を引く
  getArtistByAddress(address) {
    const lower = address.toLowerCase();
    return this.contracts.nfts.find(n => n.address.toLowerCase() === lower) || null;
  },
};

// =================================================
// ABI定義（human-readable → Web3.js用JSON ABI）
// =================================================

const ABI = {
  ERC721: [
    { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
    { "constant": true, "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "name": "", "type": "address" }], "type": "function" },
    { "constant": true, "inputs": [{ "name": "tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
    { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
    { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
  ],

  ERC721Enumerable: [
    { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
    { "constant": true, "inputs": [{ "name": "index", "type": "uint256" }], "name": "tokenByIndex", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
    { "constant": true, "inputs": [{ "name": "owner", "type": "address" }, { "name": "index", "type": "uint256" }], "name": "tokenOfOwnerByIndex", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  ],

  // ERC-6551 v0.2.0: account(address,uint256,address,uint256,uint256)
  ERC6551Registry: [
    { "constant": true, "inputs": [{ "name": "implementation", "type": "address" }, { "name": "chainId", "type": "uint256" }, { "name": "tokenContract", "type": "address" }, { "name": "tokenId", "type": "uint256" }, { "name": "salt", "type": "uint256" }], "name": "account", "outputs": [{ "name": "", "type": "address" }], "type": "function" },
  ],
};

// TBA Account ABI
ABI.TBAAccount = [
  { "constant": true, "inputs": [], "name": "owner", "outputs": [{ "name": "", "type": "address" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "token", "outputs": [{ "name": "", "type": "uint256" }, { "name": "", "type": "address" }, { "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "nonce", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }, { "name": "data", "type": "bytes" }], "name": "executeCall", "outputs": [{ "name": "result", "type": "bytes" }], "stateMutability": "payable", "type": "function" },
];

// Donate コントラクト ABI
ABI.Donate = [
  // ── Read ──
  { "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "_allTotalDonations", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "_allUsedPoints", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "_totalDonations", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "", "type": "address" }], "name": "_usedPoints", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "donor", "type": "address" }], "name": "latestPoint", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "sender", "type": "address" }], "name": "getDonationHistory", "outputs": [{ "components": [{ "name": "amount", "type": "uint256" }, { "name": "date", "type": "uint256" }, { "name": "detail", "type": "string" }], "name": "", "type": "tuple[]" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "sender", "type": "address" }], "name": "getsubstituteDonationHistory", "outputs": [{ "components": [{ "name": "amount", "type": "uint256" }, { "name": "donor", "type": "address" }, { "name": "date", "type": "uint256" }, { "name": "detail", "type": "string" }], "name": "", "type": "tuple[]" }], "type": "function" },
  // ── Write ──
  { "inputs": [{ "name": "donor", "type": "address" }, { "name": "detail", "type": "string" }, { "name": "gasCashback", "type": "uint256" }], "name": "donate", "outputs": [], "stateMutability": "payable", "type": "function" },
];

// Manager ABI
ABI.Manager = [
  // ── Read ──
  { "constant": true, "inputs": [], "name": "checkUser", "outputs": [{ "name": "", "type": "string" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "getAdmins", "outputs": [{ "name": "", "type": "address[]" }, { "name": "", "type": "uint256" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "getAllContracts", "outputs": [{ "name": "", "type": "address[]" }, { "name": "", "type": "string[]" }, { "name": "", "type": "string[]" }, { "name": "", "type": "bool[]" }], "type": "function" },
  { "constant": true, "inputs": [], "name": "getAllCreators", "outputs": [{ "name": "", "type": "address[]" }, { "name": "", "type": "string[]" }, { "name": "", "type": "string[]" }, { "name": "", "type": "bool[]" }], "type": "function" },
  { "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "getContract", "outputs": [{ "name": "", "type": "address" }, { "name": "", "type": "string" }, { "name": "", "type": "string" }, { "name": "", "type": "bool" }], "type": "function" },
  // ── Write (admin only) ──
  { "inputs": [{ "name": "account", "type": "address" }], "name": "setAdmin", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "delAdmin", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }, { "name": "name", "type": "string" }, { "name": "typename", "type": "string" }], "name": "setCreator", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }, { "name": "name", "type": "string" }, { "name": "typename", "type": "string" }], "name": "setCreatorInfo", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "delCreator", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "hiddenCreator", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "publicCreator", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }, { "name": "name", "type": "string" }, { "name": "typename", "type": "string" }], "name": "setContract", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }, { "name": "name", "type": "string" }, { "name": "typename", "type": "string" }], "name": "setContractInfo", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "deleteContract", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "hiddenContract", "outputs": [], "type": "function" },
  { "inputs": [{ "name": "account", "type": "address" }], "name": "publicContract", "outputs": [], "type": "function" },
];

// フルABI（ERC721 + Enumerable を結合）
ABI.ERC721Full = [...ABI.ERC721, ...ABI.ERC721Enumerable];
