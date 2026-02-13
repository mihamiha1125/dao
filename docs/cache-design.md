# BizenDAO キャッシュ設計書

**作成日**: 2026-02-13
**ステータス**: 運用中（Phase 1）

---

## 方針

BizenDAOのNFTデータは**オンチェーン + Arweave**に永続保存されており、
一度確定したデータは変更されない（immutable）。
この特性を活かし、**localStorageによるクライアントサイドキャッシュ**を積極的に使う。

### 目的
- 公開RPCのレート制限回避
- 2回目以降の表示を爆速に
- Arweaveゲートウェイへの負荷軽減

---

## データ分類

| データ | 可変性 | キャッシュ | TTL |
|--------|--------|-----------|-----|
| tokenURI(tokenId) | **不変** | ✅ 永続 | なし |
| メタデータ（name, image, description等） | **不変** | ✅ 永続 | なし |
| コントラクト情報（name, symbol） | **不変** | ✅ 永続 | なし |
| totalSupply | **増加のみ** | ✅ 短期 | 5分 |
| balanceOf(address) | **可変** | ✅ 短期 | 1分 |
| ownerOf(tokenId) | **可変** | ✅ 短期 | 1分 |
| TBAアドレス（Registry.account()） | **不変** | ✅ 永続 | なし |
| TBA内アセット（balanceOf(tba)） | **可変** | ✅ 短期 | 1分 |

### 不変データ（永続キャッシュ）
tokenURIはコントラクトにハードコードされており、Arweave上のメタデータも永続。
一度取得したら**ブラウザのlocalStorageが消えるまで有効**。

### 可変データ（短期キャッシュ）
所有権やTBA内アセットは変動する。短いTTLで定期リフレッシュ。

---

## キー設計

```
bizen:{種別}:{アドレス}:{ID}
```

| 種別 | キー | 値 | TTL |
|------|------|-----|-----|
| NFTメタデータ | `bizen:nft:{ca}:{tokenId}` | メタデータJSON | 永続 |
| コントラクト情報 | `bizen:contract:{ca}` | {name, symbol, totalSupply, fetchedAt} | totalSupplyのみ5分 |
| TBAアドレス | `bizen:tba:{ca}:{tokenId}` | アドレス文字列 | 永続 |
| 所有トークン一覧 | `bizen:owned:{ca}:{owner}` | {tokenIds, fetchedAt} | 1分 |
| TBA内アセット | `bizen:tba-assets:{tbaAddress}` | {assets, fetchedAt} | 1分 |

---

## 実装（nft.js）

### 現在実装済み（Phase 1）
- `bizen:nft:{ca}:{tokenId}` — NFTメタデータ永続キャッシュ

### Phase 2 追加予定
```javascript
const Cache = {
  // 永続キャッシュ（immutableデータ用）
  getPermanent(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  setPermanent(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* full */ }
  },

  // TTL付きキャッシュ（可変データ用）
  get(key, ttlMs) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > ttlMs) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify({ data: value, ts: Date.now() }));
    } catch { /* full */ }
  },

  // キャッシュクリア（デバッグ・トラブルシューティング用）
  clearAll() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('bizen:')) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    return keys.length;
  },

  // キャッシュ統計
  stats() {
    let count = 0, bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('bizen:')) {
        count++;
        bytes += key.length + localStorage.getItem(key).length;
      }
    }
    return { count, bytes, kb: Math.round(bytes / 1024) };
  },
};
```

---

## localStorage容量

- 一般的なブラウザ: **5〜10MB**
- 1つのNFTメタデータ: 約 **0.5〜1KB**
- 4コントラクト × 各100トークン = 400件 → 約 **200〜400KB**
- **余裕あり**（全トークンキャッシュしても容量問題なし）

### 容量超過時
- `try/catch`で`QuotaExceededError`をキャッチ
- 書き込み失敗しても動作に影響なし（キャッシュミスとして扱う）

---

## キャッシュ無効化

### 自動
- TTL付きデータは期限切れで自動削除

### 手動
- `Cache.clearAll()` でBizenDAO関連キャッシュを一括クリア
- ブラウザのlocalStorageクリアで全削除
- 将来: UI上に「キャッシュクリア」ボタン設置も検討

### 不変データの例外
tokenURIがimmutableである前提が崩れるケースは**コントラクトの移行**のみ。
その場合はコントラクトアドレス自体が変わるのでキャッシュキーも変わる。問題なし。

---

## 今後の拡張

- [ ] Phase 2: Cache モジュールとして nft.js から分離（`js/cache.js`）
- [ ] Phase 2: コントラクト情報・TBAアドレスもキャッシュ
- [ ] Phase 2: 所有トークン一覧のTTLキャッシュ
- [ ] Phase 3: IndexedDB への移行検討（画像blobキャッシュが必要になった場合）
- [ ] Phase 3: Service Worker によるオフライン対応
