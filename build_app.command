#!/bin/bash
# ============================================
# ダブルクリックでMacアプリを作成するスクリプト
# ============================================

# スクリプトのあるフォルダに移動
cd "$(dirname "$0")"

echo "======================================"
echo "  デスクトップ整理ツール ビルダー"
echo "======================================"
echo ""

# py2appがインストールされているか確認
if ! python3 -c "import py2app" 2>/dev/null; then
    echo "📦 py2app をインストール中..."
    pip3 install py2app
    echo ""
fi

# 古いビルドを削除
echo "🧹 古いビルドファイルを削除中..."
rm -rf build dist
echo ""

# アプリをビルド
echo "🔨 アプリをビルド中..."
python3 setup.py py2app
echo ""

if [ -d "dist/デスクトップ整理ツール.app" ]; then
    echo "✅ 完成しました！"
    echo ""
    echo "📍 アプリの場所:"
    echo "   $(pwd)/dist/デスクトップ整理ツール.app"
    echo ""
    echo "💡 このアプリを「アプリケーション」フォルダにドラッグすると"
    echo "   いつでも使えるようになります！"
    echo ""

    # distフォルダを開く
    open dist/
else
    echo "❌ ビルドに失敗しました"
    echo "   エラーメッセージを確認してください"
fi

echo ""
echo "何かキーを押すと閉じます..."
read -n 1
