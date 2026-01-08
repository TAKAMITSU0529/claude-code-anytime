#!/bin/bash
# ============================================
# 初心者向け：ダブルクリックでセットアップ完了！
# ============================================

cd "$(dirname "$0")"

echo "======================================"
echo "  デスクトップ整理ツール インストーラー"
echo "======================================"
echo ""
echo "これから自動でセットアップします。"
echo "少し時間がかかることがあります。"
echo ""

# Pythonの確認
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3がインストールされていません"
    echo ""
    echo "以下のサイトからPythonをインストールしてください："
    echo "https://www.python.org/downloads/"
    echo ""
    echo "何かキーを押すと閉じます..."
    read -n 1
    exit 1
fi

echo "✅ Python3 が見つかりました"
python3 --version
echo ""

# py2appのインストール
echo "📦 必要なツールをインストール中..."
pip3 install py2app --quiet
echo "✅ 完了"
echo ""

# アプリをビルド
echo "🔨 アプリを作成中..."
echo "   （1〜2分かかります）"
echo ""

rm -rf build dist 2>/dev/null
python3 setup.py py2app 2>&1 | grep -E "(running|copying|creating|error|Error)"

echo ""

if [ -d "dist/デスクトップ整理ツール.app" ]; then
    echo "======================================"
    echo "🎉 インストール完了！"
    echo "======================================"
    echo ""
    echo "アプリができました！"
    echo ""

    # アプリケーションフォルダにコピーするか確認
    echo "「アプリケーション」フォルダにコピーしますか？"
    echo "（y: はい / n: いいえ）"
    read -n 1 answer
    echo ""

    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        cp -R "dist/デスクトップ整理ツール.app" /Applications/
        echo ""
        echo "✅ アプリケーションフォルダにコピーしました！"
        echo ""
        echo "🚀 Launchpadから「デスクトップ整理ツール」を"
        echo "   探して起動できます！"
    else
        echo ""
        echo "📍 アプリの場所:"
        echo "   $(pwd)/dist/デスクトップ整理ツール.app"
        echo ""
        echo "💡 このアプリをダブルクリックで起動できます"
    fi

    # フォルダを開く
    open dist/
else
    echo "======================================"
    echo "❌ エラーが発生しました"
    echo "======================================"
    echo ""
    echo "Macの「システム設定」→「プライバシーとセキュリティ」で"
    echo "ターミナルにアクセス権限を許可してから、"
    echo "もう一度このファイルをダブルクリックしてください。"
fi

echo ""
echo "何かキーを押すと閉じます..."
read -n 1
