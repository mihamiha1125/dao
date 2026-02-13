# BizenDAO サイトリニューアル計画書
## マイページ & 寄付ページ

**作成日**: 2026-02-13
**ステータス**: 設計段階

---

## 背景

bizen.sbs はモノリシックな構成で、分散型コミュニティでのメンテナンスが困難。
必要な機能を軽量なフロントエンドとして ~/tools/dao に再構成する。

---

## 技術スタック

- **チェーン**: Polygon Mainnet (chainId: 137)
- **RPC**: `https://polygon-rpc.com`（既存コードで使用中）
- **ライブラリ**: Web3.js 1.10.0 + Vue 3（既存と統一）
- **フロントエンド**: HTML + CSS + vanilla JS（フレームワーク非依存、コミュニティが読み書きしやすく）
- **メタデータ**: Arweave（tokenURIから取得、IPFSフォールバック対応済み）

---

## コントラクト一覧

| 種別 | 名前 | アドレス |
|------|------|---------|
| NFT (ERC-721) | 森 敏彰 | `0x4D0Abc6272E1288A177EA8E3076d4aFe2DB9C658` |
| NFT (ERC-721) | 森 大雅 | `0x3DAC002d33A0c6F1c1684783DDaA78E5f29F14cc` |
| NFT (ERC-721) | 宝山窯 | `0xd84d7A7FE688a1CC40a931cab2aaF189eB3ceEcB` |
| NFT (ERC-721) | 藤田 祥 | `0x6C8b4094809CE7e5Ec1a44F7553Cf51b969C2aEb` |
| SBT | メンバーシップ | `0xFcC45d28E7e51Cff6d8181Bd73023d46daf1fEd2` |
| TBA Registry | (1) | `0xa8a05744C04c7AD0D31Fcee368aC18040832F1c1` |
| TBA Registry | (2) | `0x63c8A3536E4A647D48fC0076D442e3243f7e773b` |
| Donation | treasury | `0x94280C465Be5C49B02b779Fd02d344815cb937d6` |

※ `0x72A02d...8623` は旧コントラクト。使用しない。

---

## 既存資産

### contract.html
- コントラクトアドレス入力 → ERC-721 Enumerable で全トークン一覧表示
- Web3.js + Vue 3 構成
- MetaMask不要（RPC直接読み取り）
- バッチ処理（50件ずつ並列取得）

### token.html
- コントラクト + tokenId 指定で個別NFT詳細表示
- Arweave / IPFS 両対応（URI自動変換）
- animation_url対応（動画、3Dモデル=GLB → viewer/連携）
- MIMEタイプ自動判定（拡張子 → HEADリクエスト）
- URLパラメータ連携: `token.html?ca=0x...&id=26`

### viewer/
- model-viewer.js による3Dモデル表示

### 再利用可能なコード
- `fetchTokenMetadata()` — tokenURI取得 → メタデータパース → 画像URL変換
- `fetchContractInfo()` — name/symbol/totalSupply取得
- `fetchTokenList()` — Enumerableバッチ列挙
- ABI定義（ERC-721 / ERC-721 Enumerable）
- CSS（ダークテーマ、カードUI、レスポンシブ）

---

## 1. マイページ (`mypage.html`)

### 概要
MetaMask接続後、ユーザーが所有する備前焼NFT + SBTの一覧を表示するポートフォリオページ。

### 画面構成

```
┌─────────────────────────────────────┐
│  🦊 ウォレット接続 / 0x1234...5678   │
│  [SBT] BizenDAO Member ✓            │
├─────────────────────────────────────┤
│                                      │
│  ── 森 敏彰 ──────────────────────   │
│  ┌───┐ ┌───┐                        │
│  │   │ │   │  作品名 / tokenId       │
│  └───┘ └───┘  → 詳細(token.html)    │
│                                      │
│  ── 藤田 祥 ──────────────────────   │
│  ┌───┐                               │
│  │   │  作品名 / tokenId             │
│  └───┘  → 詳細(token.html)          │
│                                      │
│  ── 所有なし ─────────────────────   │
│  （コレクションがありません）          │
│                                      │
├─────────────────────────────────────┤
│  合計: 3点 / 2作家                   │
└─────────────────────────────────────┘
```

### 機能一覧

| # | 機能 | 詳細 |
|---|------|------|
| 1 | ウォレット接続 | MetaMask `eth_requestAccounts` |
| 2 | チェーン切替 | Polygon(137) でなければ `wallet_switchEthereumChain` |
| 3 | SBT確認 | `balanceOf(address)` > 0 → メンバーバッジ表示 |
| 4 | NFT列挙 | 4コントラクト並列で `balanceOf` → `tokenOfOwnerByIndex` |
| 5 | メタデータ取得 | `tokenURI` → Arweave JSON → 画像・名前・属性 |
| 6 | 作家別グルーピング | コントラクト単位で作家名をセクションヘッダに |
| 7 | 詳細リンク | token.html?ca=0x...&id=X への遷移 |
| 8 | 未接続状態 | MetaMask未インストール → インストール案内 |
| 9 | レスポンシブ | モバイル対応グリッド |

### データフロー

```
[MetaMask] → eth_requestAccounts → address
                                      │
     ┌──────────┬──────────┬──────────┼──────────┐
     ▼          ▼          ▼          ▼          ▼
  森敏彰NFT  森大雅NFT  宝山窯NFT  藤田祥NFT   SBT
  balanceOf  balanceOf  balanceOf  balanceOf  balanceOf
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼
  tokenOf    tokenOf    tokenOf    tokenOf    badge
  OwnerBy    OwnerBy    OwnerBy    OwnerBy    表示
  Index      Index      Index      Index
     │          │          │          │
     ▼          ▼          ▼          ▼
  tokenURI  tokenURI  tokenURI  tokenURI
  (Arweave) (Arweave) (Arweave) (Arweave)
     │          │          │          │
     └──────────┴──────────┴──────────┘
                    │
                    ▼
            作家別グルーピング表示
```

### MetaMask未接続時

- ウォレット接続ボタンのみ表示
- MetaMask未インストール → 「MetaMaskをインストールしてください」+ リンク
- 接続拒否 → リトライボタン

---

## 2. 寄付ページ (`donation.html`)

### 概要
BizenDAO treasuryへMATICを寄付できるページ。

### 画面構成

```
┌─────────────────────────────────────┐
│  BizenDAOを応援する                  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │ DAOの活動紹介                  │  │
│  │ 備前焼の文化を守り、            │  │
│  │ デジタル技術で世界に届ける...   │  │
│  └───────────────────────────────┘  │
│                                      │
│  🦊 ウォレット接続 / 0x1234...5678   │
│                                      │
│  寄付金額 (MATIC):                   │
│  [1] [5] [10] [50] [カスタム: ___]   │
│                                      │
│  [💎 寄付する]                       │
│                                      │
│  ─── 完了 ───────────────────────   │
│  ✅ ありがとうございます！            │
│  tx: 0xabc...def                     │
│  [Polygonscanで確認 ↗]              │
└─────────────────────────────────────┘
```

### 機能一覧

| # | 機能 | 詳細 |
|---|------|------|
| 1 | ウォレット接続 | wallet.js 共通モジュール |
| 2 | 金額プリセット | 1 / 5 / 10 / 50 MATIC ボタン |
| 3 | カスタム金額 | 任意入力 |
| 4 | MATIC送金 | `eth_sendTransaction` → treasury |
| 5 | tx確認 | Polygonscan リンク表示 |
| 6 | エラーハンドリング | 残高不足、拒否、ネットワークエラー |
| 7 | 活動紹介 | DAOのミッション・使途説明 |

### 送金フロー

```
[金額選択] → [寄付するボタン]
                  │
                  ▼
          eth_sendTransaction({
            to: 0x94280C...7d6,
            value: Web3.utils.toWei(amount, 'ether')
          })
                  │
                  ▼
          [MetaMask確認画面]
                  │
          ┌───────┴───────┐
          ▼               ▼
       承認             拒否
          │               │
          ▼               ▼
     tx hash取得      エラー表示
          │
          ▼
     Polygonscanリンク
     + お礼メッセージ
```

---

## 3. 共通モジュール設計

### js/wallet.js

```javascript
// 公開API
const Wallet = {
  connect()           // → { address, chainId }
  disconnect()        // 状態クリア
  ensurePolygon()     // chainId 137 でなければ切替
  getAddress()        // → string | null
  isConnected()       // → boolean
  onAccountChange(cb) // アカウント変更コールバック
  onChainChange(cb)   // チェーン変更コールバック
}
```

### js/contracts.js

```javascript
// コントラクト定義を一元管理
const CONTRACTS = {
  nfts: [
    { key: 'mori-toshiaki', name: '森 敏彰', address: '0x4D0A...' },
    { key: 'mori-taiga',    name: '森 大雅', address: '0x3DAC...' },
    { key: 'hozangama',     name: '宝山窯',  address: '0xd84d...' },
    { key: 'fujita-syo',    name: '藤田 祥', address: '0x6C8b...' },
  ],
  sbt: { address: '0xFcC4...' },
  tba: ['0xa8a0...', '0x63c8...'],
  donation: '0x94280C465Be5C49B02b779Fd02d344815cb937d6',
}

// ABI定義（ERC-721 Enumerable 必要最小限）
const ERC721_ABI = [ ... ]  // 既存 contract.html / token.html から抽出
```

### js/nft.js

```javascript
// 既存 token.html / contract.html のロジックをモジュール化
const NFT = {
  async getOwnedTokens(contract, address)  // → [tokenId, ...]
  async getTokenMetadata(contract, tokenId) // → { name, image, ... }
  async getContractInfo(contract)           // → { name, symbol, totalSupply }
}
```

---

## 4. ファイル構成（新規 + 変更）

```
dao/
├── docs/
│   ├── contracts.md          # コントラクト一覧（既存）
│   └── mypage-donation-plan.md  # この計画書
├── js/
│   ├── app.js                # 既存（変更なし）
│   ├── app2.js               # 既存（変更なし）
│   ├── app3.js               # 既存（変更なし）
│   ├── products.json         # 既存（変更なし）
│   ├── wallet.js             # 【新規】MetaMask接続共通
│   ├── contracts.js          # 【新規】コントラクト定義・ABI
│   └── nft.js                # 【新規】NFT取得ロジック共通
├── mypage.html               # 【新規】マイページ
├── donation.html             # 【新規】寄付ページ
├── contract.html             # 既存（サンプルCA更新のみ）
├── token.html                # 既存（変更なし）
└── ...
```

---

## 5. フェーズ計画

### Phase 1: 共通基盤 + マイページ
- [ ] `js/contracts.js` — コントラクト定義・ABI一元管理
- [ ] `js/wallet.js` — MetaMask接続共通モジュール
- [ ] `js/nft.js` — 既存コードからNFT取得ロジック抽出
- [ ] `mypage.html` — ウォレット接続 + SBT確認 + NFT一覧（作家別）
- [ ] `contract.html` — サンプルCAを現行コントラクトに更新

### Phase 2: 寄付ページ
- [ ] `donation.html` — 寄付UI + MATIC送金
- [ ] DAOの活動紹介コンテンツ作成

### Phase 3: TBA & 改善
- [ ] TBA (Token Bound Account) 対応 — NFTが所有するアセット表示
- [ ] NFTメタデータのキャッシュ（localStorage）
- [ ] 寄付履歴表示（オンチェーンイベント読み取り）
- [ ] 多言語対応（既存の lang パラメータ連携）
- [ ] bizen.sbs からの移行告知
- [ ] 既存 contract.html / token.html のリファクタ（共通モジュール利用に切替）

---

## 6. デザイン方針

- 既存サイトのダークテーマを踏襲
- 既存CSS（style.css）を共有
- カードUI、グラスモーフィズムは既存と統一
- MetaMask接続ボタンはヘッダー右上に配置（全ページ共通化も検討）

---

## 7. 注意事項

- **バックエンド不要** — 全てフロントエンド + オンチェーン読み取り
- **既存ページは壊さない** — 新規ファイル追加が基本、既存変更は最小限
- **コミュニティフレンドリー** — フレームワーク非依存、コード読みやすく
- **MetaMask未インストール時** のフォールバック表示を必ず実装
- **旧CA (0x72A02d...)** は使用しない
