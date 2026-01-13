--[[
    プレイヤーデータテンプレート
    Player Data Template
]]

local PlayerDataTemplate = {
    -- 基本データ
    Level = 1,
    Exp = 0,
    Coins = 0,
    Gems = 0,

    -- 現在の進化形態
    CurrentEvolution = 1,

    -- 統計
    Stats = {
        TotalKills = 0,
        TotalDamageDealt = 0,
        TotalPlayTime = 0,
        HighestLevel = 1,
        BossesDefeated = 0
    },

    -- アンロック済み進化形態
    UnlockedEvolutions = {1}, -- 最初は1のみ

    -- 所持シークレット
    Secrets = {
        -- [secretId] = count
    },

    -- トレード統計
    TradeStats = {
        TotalTrades = 0,
        TotalValueTraded = 0
    },

    -- 設定
    Settings = {
        MusicEnabled = true,
        SFXEnabled = true,
        ShowDamageNumbers = true,
        Language = "ja" -- "ja" or "en"
    },

    -- 日付関連
    LastLoginDate = "",
    DailyLoginStreak = 0,

    -- イベント参加記録
    EventsParticipated = 0
}

return PlayerDataTemplate
