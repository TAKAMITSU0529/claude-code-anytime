#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ファイル整理ロジック
デスクトップ上のファイルをジャンル別フォルダに自動仕分けする
"""

import os
import shutil
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class FileOrganizer:
    """ファイルをジャンル別に整理するクラス"""

    def __init__(self, config_path: str = None):
        """
        初期化

        Args:
            config_path: 設定ファイルのパス（Noneの場合はデフォルト）
        """
        if config_path is None:
            config_path = Path(__file__).parent / "config.json"

        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.desktop_path = Path(self.config.get("desktop_path", "~/Desktop")).expanduser()
        self.categories = self.config.get("categories", {})

        # 拡張子からカテゴリへの逆引きマップを作成
        self._ext_to_category: Dict[str, str] = {}
        for category, data in self.categories.items():
            for ext in data.get("extensions", []):
                self._ext_to_category[ext.lower()] = category

    def _load_config(self) -> dict:
        """設定ファイルを読み込む"""
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"設定ファイルが見つかりません: {self.config_path}")
            return {"desktop_path": "~/Desktop", "categories": {}}
        except json.JSONDecodeError as e:
            print(f"設定ファイルの解析エラー: {e}")
            return {"desktop_path": "~/Desktop", "categories": {}}

    def save_config(self) -> None:
        """設定ファイルを保存する"""
        self.config["desktop_path"] = str(self.desktop_path)
        self.config["categories"] = self.categories

        with open(self.config_path, "w", encoding="utf-8") as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)

    def get_category(self, file_path: str) -> str:
        """
        ファイルのカテゴリを判定する

        Args:
            file_path: ファイルパス

        Returns:
            カテゴリ名
        """
        ext = Path(file_path).suffix.lower()
        return self._ext_to_category.get(ext, "その他")

    def get_destination_folder(self, category: str) -> Path:
        """
        カテゴリに対応する移動先フォルダを取得

        Args:
            category: カテゴリ名

        Returns:
            フォルダパス
        """
        if category in self.categories:
            folder_name = self.categories[category].get("folder", category)
        else:
            folder_name = self.categories.get("その他", {}).get("folder", "その他フォルダ")

        return self.desktop_path / folder_name

    def ensure_folders_exist(self) -> None:
        """全てのカテゴリフォルダを作成する"""
        for category, data in self.categories.items():
            folder_path = self.desktop_path / data.get("folder", category)
            folder_path.mkdir(parents=True, exist_ok=True)

    def organize_file(self, file_path: str, dry_run: bool = False) -> Tuple[bool, str, str]:
        """
        単一ファイルを整理する

        Args:
            file_path: 整理するファイルのパス
            dry_run: Trueの場合、実際には移動しない

        Returns:
            (成功フラグ, カテゴリ, メッセージ)
        """
        file_path = Path(file_path)

        if not file_path.exists():
            return False, "", f"ファイルが見つかりません: {file_path}"

        if file_path.is_dir():
            return False, "", f"フォルダは対象外です: {file_path}"

        category = self.get_category(str(file_path))
        dest_folder = self.get_destination_folder(category)
        dest_path = dest_folder / file_path.name

        # 同名ファイルが存在する場合の処理
        if dest_path.exists():
            base = dest_path.stem
            ext = dest_path.suffix
            counter = 1
            while dest_path.exists():
                dest_path = dest_folder / f"{base}_{counter}{ext}"
                counter += 1

        if dry_run:
            return True, category, f"[プレビュー] {file_path.name} → {category} ({dest_folder.name})"

        try:
            dest_folder.mkdir(parents=True, exist_ok=True)
            shutil.move(str(file_path), str(dest_path))
            return True, category, f"{file_path.name} → {category} ({dest_folder.name})"
        except Exception as e:
            return False, category, f"移動エラー: {file_path.name} - {e}"

    def organize_files(self, file_paths: List[str], dry_run: bool = False) -> List[Tuple[bool, str, str]]:
        """
        複数ファイルを整理する

        Args:
            file_paths: ファイルパスのリスト
            dry_run: Trueの場合、実際には移動しない

        Returns:
            結果のリスト [(成功フラグ, カテゴリ, メッセージ), ...]
        """
        results = []
        for file_path in file_paths:
            result = self.organize_file(file_path, dry_run)
            results.append(result)
        return results

    def get_all_categories(self) -> List[str]:
        """全カテゴリ名のリストを取得"""
        return list(self.categories.keys())

    def add_category(self, name: str, folder: str, extensions: List[str]) -> None:
        """
        新しいカテゴリを追加

        Args:
            name: カテゴリ名
            folder: フォルダ名
            extensions: 拡張子リスト
        """
        self.categories[name] = {
            "folder": folder,
            "extensions": extensions
        }
        # 拡張子マップを更新
        for ext in extensions:
            self._ext_to_category[ext.lower()] = name

    def update_desktop_path(self, new_path: str) -> None:
        """デスクトップパスを更新"""
        self.desktop_path = Path(new_path).expanduser()


def main():
    """テスト用メイン関数"""
    organizer = FileOrganizer()
    print("利用可能なカテゴリ:")
    for category in organizer.get_all_categories():
        folder = organizer.categories[category].get("folder")
        extensions = organizer.categories[category].get("extensions", [])
        print(f"  {category}: {folder}")
        print(f"    拡張子: {', '.join(extensions) if extensions else '(その他全て)'}")


if __name__ == "__main__":
    main()
