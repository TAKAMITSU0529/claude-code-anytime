# デスクトップファイル整理ツール

Macのデスクトップに散らばったファイルをドラッグ&ドロップで簡単に整理するツールです。
ファイルの拡張子に基づいて、自動的にジャンル別のフォルダに仕分けします。

## 機能

- ドラッグ&ドロップでファイルを整理
- ファイルの種類を自動判別してカテゴリ分け
- カスタマイズ可能なカテゴリ設定
- GUIモードとCLIモード両対応
- プレビュー機能（実行前に確認可能）

## デフォルトのカテゴリ

| カテゴリ | 対象フォルダ | 対象拡張子 |
|---------|-------------|-----------|
| 画像 | 画像フォルダ | .jpg, .jpeg, .png, .gif, .bmp, .svg, .webp, .heic, .tiff, .ico |
| ドキュメント | ドキュメントフォルダ | .pdf, .doc, .docx, .txt, .rtf, .odt, .pages |
| スプレッドシート | スプレッドシートフォルダ | .xls, .xlsx, .csv, .numbers, .ods |
| プレゼン | プレゼンフォルダ | .ppt, .pptx, .key, .odp |
| 動画 | 動画フォルダ | .mp4, .mov, .avi, .mkv, .wmv, .flv, .webm, .m4v |
| 音楽 | 音楽フォルダ | .mp3, .wav, .aac, .flac, .m4a, .ogg, .wma |
| 圧縮ファイル | 圧縮ファイルフォルダ | .zip, .rar, .7z, .tar, .gz, .dmg, .pkg |
| コード | コードフォルダ | .py, .js, .ts, .html, .css, .json, .xml, .java など |
| フォント | フォントフォルダ | .ttf, .otf, .woff, .woff2, .eot |
| その他 | その他フォルダ | 上記以外のファイル |

## インストール

### 必要条件

- Python 3.8以上
- tkinter（Macには標準でインストール済み）

### オプション（ドラッグ&ドロップを有効化）

```bash
pip install tkinterdnd2
```

## 使い方

### GUIモード（推奨）

```bash
python main.py
```

1. アプリが起動したら、整理したいファイルをドロップエリアにドラッグ&ドロップ
2. ファイルが自動的にカテゴリ判定されてリストに追加
3. 「プレビュー」ボタンで移動先を確認
4. 「整理を実行」ボタンでファイルを移動

### CLIモード

```bash
# 指定ファイルを整理
python main.py --cli file1.pdf file2.jpg

# プレビュー（実際には移動しない）
python main.py --cli --dry-run *.pdf

# カテゴリフォルダを事前に作成
python main.py --cli --create-folders

# カテゴリ一覧を表示
python main.py --cli --list-categories

# デスクトップパスを指定
python main.py --cli --desktop ~/Desktop *.png
```

## カスタマイズ

`config.json` を編集してカテゴリをカスタマイズできます：

```json
{
  "desktop_path": "~/Desktop",
  "categories": {
    "カテゴリ名": {
      "folder": "移動先フォルダ名",
      "extensions": [".ext1", ".ext2"]
    }
  }
}
```

### 新しいカテゴリを追加する例

```json
{
  "3Dモデル": {
    "folder": "3Dモデルフォルダ",
    "extensions": [".obj", ".fbx", ".blend", ".stl"]
  }
}
```

## ファイル構成

```
desktop-file-organizer/
├── main.py          # メインエントリーポイント
├── gui.py           # GUIアプリケーション
├── organizer.py     # ファイル整理ロジック
├── config.json      # 設定ファイル
└── README.md        # このファイル
```

## 注意事項

- フォルダ（ディレクトリ）は整理対象外です
- 同名ファイルが存在する場合は自動的に連番が付加されます
- 整理前に「プレビュー」で移動先を確認することをお勧めします

## ライセンス

MIT License
