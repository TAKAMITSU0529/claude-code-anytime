"""
py2appでMacアプリを作成するための設定ファイル
"""

from setuptools import setup

APP = ['main.py']
DATA_FILES = ['config.json']
OPTIONS = {
    'argv_emulation': True,
    'iconfile': None,  # アイコンファイルがあれば指定
    'plist': {
        'CFBundleName': 'デスクトップ整理ツール',
        'CFBundleDisplayName': 'デスクトップ整理ツール',
        'CFBundleGetInfoString': 'デスクトップのファイルを自動整理',
        'CFBundleIdentifier': 'com.desktop.organizer',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'NSHighResolutionCapable': True,
    },
    'packages': [],
}

setup(
    app=APP,
    name='デスクトップ整理ツール',
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
