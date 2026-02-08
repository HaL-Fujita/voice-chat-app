# オールイン番長 Voice Chat 🎰

音声で会話できるAIチャットアプリ

## 機能

- 🎤 音声認識（Web Speech API）
- 🔊 音声合成（ずんだもん対応）
- 👄 口パクアニメーション
- 👁️ 自然なまばたき
- 🎨 暖かみのあるUI

## セットアップ

### 1. 設定

`app.js` の CONFIG を編集：

```javascript
const CONFIG = {
  API_URL: 'https://your-openclaw.fly.dev/v1/chat/completions',
  API_TOKEN: 'your-gateway-token', // 必要な場合
  MODEL: 'anthropic/claude-sonnet-4-20250514'
};
```

### 2. ローカル実行

```bash
npx serve .
# http://localhost:3000 でアクセス
```

### 3. Vercelデプロイ

```bash
npm i -g vercel
vercel
```

## 注意事項

- **ブラウザ**: Chrome推奨（音声認識）
- **HTTPS**: 音声認識にはHTTPS必須（localhost除く）
- **ずんだもん**: VOICEVOXをローカルで起動必要

## ファイル構成

```
├── index.html   # メインページ
├── style.css    # スタイル
├── app.js       # ロジック
├── avatar.jpg   # キャラ画像
└── vercel.json  # デプロイ設定
```
