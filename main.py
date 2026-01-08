#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
デスクトップファイル整理ツール
Macのデスクトップにあるファイルをジャンル別フォルダに自動仕分けする

使い方:
    python main.py          # GUIモードで起動
    python main.py --cli    # CLIモードで起動
    python main.py --help   # ヘルプを表示
"""

import argparse
import sys
from pathlib import Path

from organizer import FileOrganizer


def run_gui():
    """GUIモードで起動"""
    try:
        from gui import OrganizerGUI
        app = OrganizerGUI()
        app.run()
    except ImportError as e:
        print(f"GUIの起動に失敗しました: {e}")
        print("tkinterがインストールされているか確認してください")
        sys.exit(1)


def run_cli(args):
    """CLIモードで実行"""
    organizer = FileOrganizer()

    if args.desktop:
        organizer.update_desktop_path(args.desktop)

    if args.create_folders:
        print(f"カテゴリフォルダを作成中: {organizer.desktop_path}")
        organizer.ensure_folders_exist()
        print("完了しました！")
        return

    if args.list_categories:
        print("利用可能なカテゴリ:")
        for category in organizer.get_all_categories():
            folder = organizer.categories[category].get("folder")
            extensions = organizer.categories[category].get("extensions", [])
            print(f"\n  📁 {category}")
            print(f"     フォルダ: {folder}")
            print(f"     拡張子: {', '.join(extensions) if extensions else '(その他全て)'}")
        return

    if args.files:
        files = [Path(f).resolve() for f in args.files]
        print(f"\n{len(files)} 個のファイルを整理します...")

        if args.dry_run:
            print("[プレビューモード - 実際には移動しません]\n")

        results = organizer.organize_files([str(f) for f in files], dry_run=args.dry_run)

        success_count = 0
        for success, category, message in results:
            symbol = "✓" if success else "✗"
            print(f"  {symbol} {message}")
            if success:
                success_count += 1

        print(f"\n完了: {success_count}/{len(results)} 個のファイルを処理しました")
    else:
        print("整理するファイルを指定してください")
        print("使用例: python main.py --cli file1.pdf file2.jpg")


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description="デスクトップファイル整理ツール - ファイルをジャンル別に自動仕分け",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python main.py                          # GUIモードで起動
  python main.py --cli file1.pdf file2.jpg  # 指定ファイルを整理
  python main.py --cli --dry-run *.pdf    # プレビュー（実際には移動しない）
  python main.py --cli --create-folders   # カテゴリフォルダを作成
  python main.py --cli --list-categories  # カテゴリ一覧を表示
"""
    )

    parser.add_argument(
        "--cli",
        action="store_true",
        help="CLIモードで実行"
    )
    parser.add_argument(
        "--desktop",
        type=str,
        help="デスクトップフォルダのパス（デフォルト: ~/Desktop）"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="プレビューモード（実際には移動しない）"
    )
    parser.add_argument(
        "--create-folders",
        action="store_true",
        help="カテゴリフォルダを作成"
    )
    parser.add_argument(
        "--list-categories",
        action="store_true",
        help="カテゴリ一覧を表示"
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="整理するファイル（CLIモード時）"
    )

    args = parser.parse_args()

    if args.cli:
        run_cli(args)
    else:
        run_gui()


if __name__ == "__main__":
    main()
