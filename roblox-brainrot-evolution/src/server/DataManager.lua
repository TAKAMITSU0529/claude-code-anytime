--[[
    データマネージャー - プレイヤーデータの保存と読み込み
    Data Manager - Save and Load Player Data
]]

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local PlayerDataTemplate = require(game.ReplicatedStorage.Shared.PlayerDataTemplate)

local DataManager = {}

-- データストア
local PlayerDataStore = DataStoreService:GetDataStore("BrainRotEvolution_PlayerData_v1")

-- キャッシュされたプレイヤーデータ
local CachedPlayerData = {}

-- セッションロック
local SessionLocks = {}

-- データを深くコピー
local function DeepCopy(original)
    local copy = {}
    for key, value in pairs(original) do
        if type(value) == "table" then
            copy[key] = DeepCopy(value)
        else
            copy[key] = value
        end
    end
    return copy
end

-- データをテンプレートと統合（新しいフィールドを追加）
local function ReconcileData(data)
    local template = DeepCopy(PlayerDataTemplate)

    local function reconcile(target, source)
        for key, value in pairs(source) do
            if target[key] == nil then
                target[key] = value
            elseif type(target[key]) == "table" and type(value) == "table" then
                reconcile(target[key], value)
            end
        end
    end

    reconcile(data, template)
    return data
end

-- プレイヤーデータを読み込み
function DataManager.LoadPlayerData(player)
    local userId = player.UserId
    local key = "Player_" .. userId

    -- 既にロード済みの場合
    if CachedPlayerData[userId] then
        return CachedPlayerData[userId]
    end

    local success, data = pcall(function()
        return PlayerDataStore:GetAsync(key)
    end)

    if success then
        if data then
            data = ReconcileData(data)
        else
            data = DeepCopy(PlayerDataTemplate)
        end

        -- 日付チェック（デイリーログイン）
        local today = os.date("%Y-%m-%d")
        if data.LastLoginDate ~= today then
            if data.LastLoginDate == os.date("%Y-%m-%d", os.time() - 86400) then
                data.DailyLoginStreak = data.DailyLoginStreak + 1
            else
                data.DailyLoginStreak = 1
            end
            data.LastLoginDate = today
        end

        CachedPlayerData[userId] = data
        SessionLocks[userId] = true

        print("[DataManager] Loaded data for " .. player.Name)
        return data
    else
        warn("[DataManager] Failed to load data for " .. player.Name .. ": " .. tostring(data))
        return DeepCopy(PlayerDataTemplate)
    end
end

-- プレイヤーデータを保存
function DataManager.SavePlayerData(player)
    local userId = player.UserId
    local key = "Player_" .. userId
    local data = CachedPlayerData[userId]

    if not data then
        warn("[DataManager] No data to save for " .. player.Name)
        return false
    end

    local success, errorMessage = pcall(function()
        PlayerDataStore:SetAsync(key, data)
    end)

    if success then
        print("[DataManager] Saved data for " .. player.Name)
        return true
    else
        warn("[DataManager] Failed to save data for " .. player.Name .. ": " .. errorMessage)
        return false
    end
end

-- プレイヤーデータを取得
function DataManager.GetPlayerData(player)
    return CachedPlayerData[player.UserId]
end

-- プレイヤーデータを更新
function DataManager.UpdatePlayerData(player, key, value)
    local data = CachedPlayerData[player.UserId]
    if data then
        data[key] = value
        return true
    end
    return false
end

-- 経験値を追加
function DataManager.AddExp(player, amount)
    local data = CachedPlayerData[player.UserId]
    if not data then return end

    local GameConfig = require(game.ReplicatedStorage.Shared.GameConfig)

    data.Exp = data.Exp + amount

    -- レベルアップチェック
    local expRequired = GameConfig.GetExpForLevel(data.Level + 1)
    while data.Exp >= expRequired and data.Level < GameConfig.MAX_LEVEL do
        data.Exp = data.Exp - expRequired
        data.Level = data.Level + 1

        -- 最高レベル更新
        if data.Level > data.Stats.HighestLevel then
            data.Stats.HighestLevel = data.Level
        end

        -- 新しい進化形態のアンロックチェック
        for _, evolution in ipairs(GameConfig.EVOLUTIONS) do
            if data.Level >= evolution.unlockLevel then
                local hasEvolution = false
                for _, unlockedId in ipairs(data.UnlockedEvolutions) do
                    if unlockedId == evolution.id then
                        hasEvolution = true
                        break
                    end
                end
                if not hasEvolution then
                    table.insert(data.UnlockedEvolutions, evolution.id)
                end
            end
        end

        expRequired = GameConfig.GetExpForLevel(data.Level + 1)

        -- レベルアップイベントを発火
        game.ReplicatedStorage.Events.LevelUp:FireClient(player, data.Level)
    end
end

-- コインを追加
function DataManager.AddCoins(player, amount)
    local data = CachedPlayerData[player.UserId]
    if data then
        data.Coins = data.Coins + amount
    end
end

-- シークレットを追加
function DataManager.AddSecret(player, secretId)
    local data = CachedPlayerData[player.UserId]
    if data then
        if not data.Secrets[secretId] then
            data.Secrets[secretId] = 0
        end
        data.Secrets[secretId] = data.Secrets[secretId] + 1
        return true
    end
    return false
end

-- クリーンアップ
function DataManager.CleanupPlayer(player)
    local userId = player.UserId

    -- 最終保存
    DataManager.SavePlayerData(player)

    -- キャッシュをクリア
    CachedPlayerData[userId] = nil
    SessionLocks[userId] = nil

    print("[DataManager] Cleaned up data for " .. player.Name)
end

-- 自動保存（5分ごと）
task.spawn(function()
    while true do
        task.wait(300)
        for _, player in ipairs(Players:GetPlayers()) do
            DataManager.SavePlayerData(player)
        end
        print("[DataManager] Auto-saved all player data")
    end
end)

return DataManager
