#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
デスクトップファイル整理ツール - GUI
ドラッグ&ドロップでファイルを整理する
"""

import os
import sys
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from pathlib import Path
from typing import List

# tkinterdnd2がある場合はドラッグ&ドロップを有効化
try:
    from tkinterdnd2 import DND_FILES, TkinterDnD
    HAS_DND = True
except ImportError:
    HAS_DND = False

from organizer import FileOrganizer


class OrganizerGUI:
    """ファイル整理ツールのGUIクラス"""

    def __init__(self):
        # ウィンドウ作成（DnD対応の場合はTkinterDnDを使用）
        if HAS_DND:
            self.root = TkinterDnD.Tk()
        else:
            self.root = tk.Tk()

        self.root.title("デスクトップファイル整理ツール")
        self.root.geometry("600x500")
        self.root.minsize(500, 400)

        # macOSのダークモード対応
        if sys.platform == "darwin":
            self.root.configure(bg="#2d2d2d")

        self.organizer = FileOrganizer()
        self.pending_files: List[str] = []

        self._setup_ui()
        self._setup_dnd()

    def _setup_ui(self):
        """UIの構築"""
        # メインフレーム
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # ヘッダー
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 10))

        title_label = ttk.Label(
            header_frame,
            text="📂 デスクトップファイル整理ツール",
            font=("Helvetica", 16, "bold")
        )
        title_label.pack(side=tk.LEFT)

        # デスクトップパス設定
        path_frame = ttk.Frame(main_frame)
        path_frame.pack(fill=tk.X, pady=(0, 10))

        ttk.Label(path_frame, text="デスクトップ:").pack(side=tk.LEFT)
        self.path_var = tk.StringVar(value=str(self.organizer.desktop_path))
        path_entry = ttk.Entry(path_frame, textvariable=self.path_var, width=40)
        path_entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)

        browse_btn = ttk.Button(path_frame, text="参照", command=self._browse_path)
        browse_btn.pack(side=tk.LEFT)

        # ドロップエリア
        drop_frame = ttk.LabelFrame(main_frame, text="ファイルをここにドロップ", padding="20")
        drop_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        self.drop_area = tk.Canvas(
            drop_frame,
            bg="#f0f0f0",
            highlightthickness=2,
            highlightbackground="#cccccc"
        )
        self.drop_area.pack(fill=tk.BOTH, expand=True)

        # ドロップエリアの説明テキスト
        self.drop_area.bind("<Configure>", self._on_canvas_configure)

        # ファイル選択ボタン（DnDが使えない場合のフォールバック）
        self.select_btn = ttk.Button(
            drop_frame,
            text="📁 ファイルを選択",
            command=self._select_files
        )
        self.select_btn.pack(pady=10)

        # ファイルリスト
        list_frame = ttk.LabelFrame(main_frame, text="選択中のファイル", padding="5")
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)

        # スクロールバー付きリスト
        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.file_listbox = tk.Listbox(
            list_frame,
            height=6,
            yscrollcommand=scrollbar.set,
            selectmode=tk.EXTENDED
        )
        self.file_listbox.pack(fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.file_listbox.yview)

        # リストのコンテキストメニュー
        self.file_listbox.bind("<Button-2>", self._show_context_menu)  # macOS右クリック
        self.file_listbox.bind("<Button-3>", self._show_context_menu)  # Windows右クリック

        # ボタンエリア
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))

        # 整理ボタン
        self.organize_btn = ttk.Button(
            button_frame,
            text="✨ 整理を実行",
            command=self._organize_files
        )
        self.organize_btn.pack(side=tk.RIGHT, padx=5)

        # プレビューボタン
        self.preview_btn = ttk.Button(
            button_frame,
            text="👁 プレビュー",
            command=self._preview_organize
        )
        self.preview_btn.pack(side=tk.RIGHT, padx=5)

        # クリアボタン
        self.clear_btn = ttk.Button(
            button_frame,
            text="🗑 クリア",
            command=self._clear_files
        )
        self.clear_btn.pack(side=tk.RIGHT, padx=5)

        # フォルダ作成ボタン
        self.create_folders_btn = ttk.Button(
            button_frame,
            text="📁 フォルダを作成",
            command=self._create_folders
        )
        self.create_folders_btn.pack(side=tk.LEFT, padx=5)

        # 設定ボタン
        self.settings_btn = ttk.Button(
            button_frame,
            text="⚙ 設定",
            command=self._show_settings
        )
        self.settings_btn.pack(side=tk.LEFT, padx=5)

        # ステータスバー
        self.status_var = tk.StringVar(value="ファイルをドロップまたは選択してください")
        status_bar = ttk.Label(
            main_frame,
            textvariable=self.status_var,
            relief=tk.SUNKEN,
            anchor=tk.W
        )
        status_bar.pack(fill=tk.X, pady=(10, 0))

    def _on_canvas_configure(self, event):
        """キャンバスサイズ変更時の処理"""
        self.drop_area.delete("all")
        cx = event.width // 2
        cy = event.height // 2

        if HAS_DND:
            text = "ここにファイルをドラッグ&ドロップ"
        else:
            text = "下のボタンからファイルを選択\n(tkinterdnd2をインストールするとD&D対応)"

        self.drop_area.create_text(
            cx, cy,
            text=text,
            font=("Helvetica", 14),
            fill="#888888",
            justify=tk.CENTER
        )

    def _setup_dnd(self):
        """ドラッグ&ドロップの設定"""
        if not HAS_DND:
            return

        self.drop_area.drop_target_register(DND_FILES)
        self.drop_area.dnd_bind("<<Drop>>", self._on_drop)
        self.drop_area.dnd_bind("<<DragEnter>>", self._on_drag_enter)
        self.drop_area.dnd_bind("<<DragLeave>>", self._on_drag_leave)

    def _on_drop(self, event):
        """ファイルがドロップされた時の処理"""
        # ファイルパスを解析
        files = self._parse_dropped_files(event.data)
        self._add_files(files)
        self._on_drag_leave(event)

    def _parse_dropped_files(self, data: str) -> List[str]:
        """ドロップされたファイルデータを解析"""
        files = []
        # macOSの場合は波括弧で囲まれている可能性がある
        if data.startswith("{"):
            # 波括弧で囲まれたパスを処理
            import re
            pattern = r'\{([^}]+)\}|(\S+)'
            matches = re.findall(pattern, data)
            for match in matches:
                path = match[0] if match[0] else match[1]
                if path:
                    files.append(path)
        else:
            # スペース区切りのパス
            files = data.split()
        return files

    def _on_drag_enter(self, event):
        """ドラッグ中にエリアに入った時"""
        self.drop_area.configure(highlightbackground="#4CAF50", highlightthickness=3)

    def _on_drag_leave(self, event):
        """ドラッグ中にエリアから出た時"""
        self.drop_area.configure(highlightbackground="#cccccc", highlightthickness=2)

    def _browse_path(self):
        """デスクトップパスを選択"""
        path = filedialog.askdirectory(
            title="デスクトップフォルダを選択",
            initialdir=str(self.organizer.desktop_path)
        )
        if path:
            self.path_var.set(path)
            self.organizer.update_desktop_path(path)
            self.organizer.save_config()

    def _select_files(self):
        """ファイル選択ダイアログ"""
        files = filedialog.askopenfilenames(
            title="整理するファイルを選択",
            initialdir=str(self.organizer.desktop_path)
        )
        if files:
            self._add_files(list(files))

    def _add_files(self, files: List[str]):
        """ファイルをリストに追加"""
        added = 0
        for file_path in files:
            if file_path not in self.pending_files:
                if Path(file_path).is_file():
                    self.pending_files.append(file_path)
                    # カテゴリを判定して表示
                    category = self.organizer.get_category(file_path)
                    display_name = f"{Path(file_path).name} [{category}]"
                    self.file_listbox.insert(tk.END, display_name)
                    added += 1

        self.status_var.set(f"{len(self.pending_files)} 個のファイルが選択されています")

    def _clear_files(self):
        """ファイルリストをクリア"""
        self.pending_files.clear()
        self.file_listbox.delete(0, tk.END)
        self.status_var.set("ファイルをドロップまたは選択してください")

    def _preview_organize(self):
        """整理のプレビュー"""
        if not self.pending_files:
            messagebox.showinfo("情報", "ファイルが選択されていません")
            return

        results = self.organizer.organize_files(self.pending_files, dry_run=True)

        preview_window = tk.Toplevel(self.root)
        preview_window.title("整理プレビュー")
        preview_window.geometry("500x400")

        text = tk.Text(preview_window, wrap=tk.WORD, padx=10, pady=10)
        text.pack(fill=tk.BOTH, expand=True)

        for success, category, message in results:
            text.insert(tk.END, f"{'✓' if success else '✗'} {message}\n")

        text.config(state=tk.DISABLED)

    def _organize_files(self):
        """ファイルを整理する"""
        if not self.pending_files:
            messagebox.showinfo("情報", "ファイルが選択されていません")
            return

        # 確認ダイアログ
        if not messagebox.askyesno(
            "確認",
            f"{len(self.pending_files)} 個のファイルを整理しますか？"
        ):
            return

        results = self.organizer.organize_files(self.pending_files, dry_run=False)

        success_count = sum(1 for r in results if r[0])
        fail_count = len(results) - success_count

        # 結果表示
        result_window = tk.Toplevel(self.root)
        result_window.title("整理結果")
        result_window.geometry("500x400")

        text = tk.Text(result_window, wrap=tk.WORD, padx=10, pady=10)
        text.pack(fill=tk.BOTH, expand=True)

        text.insert(tk.END, f"=== 整理結果 ===\n")
        text.insert(tk.END, f"成功: {success_count} / 失敗: {fail_count}\n\n")

        for success, category, message in results:
            text.insert(tk.END, f"{'✓' if success else '✗'} {message}\n")

        text.config(state=tk.DISABLED)

        # リストをクリア
        self._clear_files()

        self.status_var.set(f"完了: {success_count}個のファイルを整理しました")

    def _create_folders(self):
        """カテゴリフォルダを作成"""
        try:
            self.organizer.update_desktop_path(self.path_var.get())
            self.organizer.ensure_folders_exist()
            messagebox.showinfo(
                "完了",
                f"カテゴリフォルダを作成しました\n場所: {self.organizer.desktop_path}"
            )
        except Exception as e:
            messagebox.showerror("エラー", f"フォルダ作成に失敗しました: {e}")

    def _show_settings(self):
        """設定ダイアログを表示"""
        settings_window = tk.Toplevel(self.root)
        settings_window.title("カテゴリ設定")
        settings_window.geometry("600x500")

        # カテゴリリスト
        list_frame = ttk.LabelFrame(settings_window, text="カテゴリ一覧", padding="10")
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # ツリービュー
        columns = ("フォルダ", "拡張子")
        tree = ttk.Treeview(list_frame, columns=columns, show="tree headings", height=15)
        tree.heading("#0", text="カテゴリ")
        tree.heading("フォルダ", text="フォルダ名")
        tree.heading("拡張子", text="対象拡張子")

        tree.column("#0", width=100)
        tree.column("フォルダ", width=150)
        tree.column("拡張子", width=300)

        for category, data in self.organizer.categories.items():
            folder = data.get("folder", "")
            extensions = ", ".join(data.get("extensions", []))
            tree.insert("", tk.END, text=category, values=(folder, extensions))

        tree.pack(fill=tk.BOTH, expand=True)

        # 説明
        info_label = ttk.Label(
            settings_window,
            text="※ カテゴリの編集は config.json ファイルを直接編集してください",
            foreground="gray"
        )
        info_label.pack(pady=10)

    def _show_context_menu(self, event):
        """コンテキストメニューを表示"""
        menu = tk.Menu(self.root, tearoff=0)
        menu.add_command(label="選択項目を削除", command=self._remove_selected)
        menu.add_separator()
        menu.add_command(label="すべてクリア", command=self._clear_files)
        menu.tk_popup(event.x_root, event.y_root)

    def _remove_selected(self):
        """選択されたファイルを削除"""
        selected = self.file_listbox.curselection()
        for index in reversed(selected):
            self.file_listbox.delete(index)
            del self.pending_files[index]
        self.status_var.set(f"{len(self.pending_files)} 個のファイルが選択されています")

    def run(self):
        """アプリケーションを実行"""
        self.root.mainloop()


def main():
    """メイン関数"""
    app = OrganizerGUI()
    app.run()


if __name__ == "__main__":
    main()
