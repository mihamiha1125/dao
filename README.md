# BizenDAO

備前焼の伝統とWeb3技術を融合させた、文化継承のためのDAO（分散型自律組織）プロジェクト

## 概要

BizenDAOは、1000年の歴史を持つ日本の伝統工芸「備前焼」をブロックチェーン技術で保護・継承することを目的としたプロジェクトです。NFT、RWA（Real World Assets）、Arweave、Token Bound Account、SBT（Soulbound Token）などの最新Web3技術を活用し、伝統工芸品のデジタル証明書発行、来歴管理、グローバルな流通促進を実現します。

### 主な特徴

- 🏺 **伝統工芸のデジタル化** - 備前焼作品をNFTとして記録・管理
- 🔐 **永続的なデータ保存** - Arweaveによる作品情報の永久保存
- 🌐 **グローバルな流通** - 世界中のコレクターとつながるプラットフォーム
- 🤝 **コミュニティ主導** - 作家、窯元、ギャラリー、ファンが参加するDAO

## プロジェクト構造

```
dao/
├── index.html              # トップページ
├── artist-list.html        # 作家一覧
├── vuesample.html          # Vue.jsサンプルページ
├── token.html              # NFT Token Viewer
├── contract.html           # Contract Token List
├── meta.html               # メタデータ管理ページ
│
├── creators/               # 作家個別ページ
│   ├── artist-mori-toshiaki.html
│   ├── artist-mori-taiga.html
│   └── artist-fujita-syo.html
│
├── minor-elements-set/     # Web3技術解説ページ
│   ├── nft.html
│   ├── rwa.html
│   ├── arweave.html
│   ├── tba.html
│   └── sbt.html
│
├── css/                    # スタイルシート
│   ├── style.css          # メインスタイル
│   ├── style-item.css     # 商品用スタイル
│   ├── style2.css         # ページ別スタイル
│   ├── style3.css         # 作家ページ用スタイル
│   └── artist-list.css    # 作家一覧用スタイル
│
├── js/                     # JavaScript
│   ├── app.js             # メインスクリプト
│   ├── app2.js            # 商品ページ用
│   ├── app3.js            # 作家ページ用
│   └── products.json      # 商品データ
│
└── img/                    # 画像ファイル
```

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **フレームワーク**: Vue.js 3 (CDN版)
- **ブロックチェーン**: Web3.js, Polygon Network
- **Web3技術**: 
  - NFT (Non-Fungible Token)
  - RWA (Real World Assets)
  - Arweave (分散型ストレージ)
  - TBA (Token Bound Account)
  - SBT (Soulbound Token)

## セットアップ

### ローカル開発環境

1. リポジトリをクローン
```bash
git clone [repository-url]
cd dao
```

2. ローカルサーバーを起動（例：Python）
```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合
npx http-server
```

3. ブラウザでアクセス
```
http://localhost:8000
```

## 主要ページ

### トップページ (index.html)
- プロジェクトの概要説明
- 日本六古窯の紹介
- 商品・作家紹介のスライダー
- Web3技術の解説リンク

### 作家紹介 (artist-list.html)
- 参加作家の一覧表示
- 各作家の詳細ページへのリンク

### Vue.jsサンプル (vuesample.html)
- インタラクティブな作品表示
- フィルタリング機能（作家、カテゴリー、価格）
- 検索機能
- モーダルでの詳細表示

### NFT Token Viewer (token.html)
- PolygonチェーンのNFT情報表示
- コントラクトアドレスとトークンIDによる検索
- TokenURIとメタデータの表示
- Web3.jsを使用したブロックチェーン接続

#### 使用方法
1. **基本的な使い方**
   - コントラクトアドレスとトークンIDを入力してNFT情報を取得
   - サンプルNFTボタンで動作確認

2. **URLパラメータでの直接指定**
   ```
   token.html?ca=0x72A02d559435319bD77462690E202a28c2Ba8623&id=26
   ```
   - `ca`: コントラクトアドレス
   - `id`: トークンID（省略時は1）

3. **表示される情報**
   - NFT名、説明、画像
   - TokenURI（メタデータのURL）
   - 属性（Attributes）
   - コントラクト情報

### Contract Token List (contract.html)
- Enumerable対応NFTコントラクトのトークン一覧表示
- コントラクト全体のトークン概要確認
- 個別トークン詳細ページへのリンク機能
- Web3.jsを使用したブロックチェーン接続

#### 使用方法
1. **基本的な使い方**
   - NFTコントラクトアドレスを入力してトークン一覧を取得
   - サンプルコントラクトボタンで動作確認

2. **URLパラメータでの直接指定**
   ```
   contract.html?ca=0x72A02d559435319bD77462690E202a28c2Ba8623
   ```
   - `ca`: コントラクトアドレス

3. **表示される情報**
   - コントラクト名、シンボル、総発行数
   - 全トークンIDの一覧表示
   - 各トークンIDをクリックでtoken.htmlへリンク
   - リアルタイムの進捗表示

### メタデータ管理 (meta.html)
- 作品情報の入力・管理
- JSON形式でのデータ出力
- ArDriveとの連携

## 外部リンク

- **Meta**: https://meta.bon-soleil.com/
- **Discord**: https://discord.gg/Fb3M7HHxs2

## 開発ガイドライン

### コーディング規約
- インデント: スペース2つ
- 文字コード: UTF-8
- 画像ファイル名: 英数字のみ使用（日本語不可）
- CSSクラス名: BEM記法推奨

### ブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- 機能ブランチ: `feature/機能名`

## ライセンス

[ライセンス情報を記載]

## コントリビューション

プロジェクトへの貢献を歓迎します。詳細は[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。

## お問い合わせ

- Discord: [BizenDAOコミュニティ](https://discord.gg/Fb3M7HHxs2)
- Email: [連絡先メールアドレス]

---

BizenDAO - 確かな歴史を新たな技術で。