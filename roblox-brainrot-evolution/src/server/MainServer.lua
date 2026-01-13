--[[
    メインサーバースクリプト
    Main Server Script - Entry Point

    このスクリプトをServerScriptServiceに配置してください
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- 共有フォルダのセットアップ
local function SetupReplicatedStorage()
    -- Sharedフォルダ
    local sharedFolder = Instance.new("Folder")
    sharedFolder.Name = "Shared"
    sharedFolder.Parent = ReplicatedStorage

    -- イベントフォルダ
    local eventsFolder = Instance.new("Folder")
    eventsFolder.Name = "Events"
    eventsFolder.Parent = ReplicatedStorage

    -- リモートイベントを作成
    local events = {
        "LevelUp",
        "RewardObtained",
        "SecretObtained",
        "DamageDealt",
        "PlayerDamaged",
        "EventStarted",
        "EventEnded",
        "TradeRequest",
        "TradeAccepted",
        "TradeCompleted",
        "TradeCancelled",
        "UpdateStats",
        "EvolutionChanged"
    }

    for _, eventName in ipairs(events) do
        local event = Instance.new("RemoteEvent")
        event.Name = eventName
        event.Parent = eventsFolder
    end

    -- リモートファンクションを作成
    local functions = {
        "GetPlayerData",
        "AttackEnemy",
        "ChangeEvolution",
        "RequestTrade",
        "RespondTrade",
        "ConfirmTrade",
        "CancelTrade",
        "GetActiveEnemies",
        "GetCurrentEvent"
    }

    for _, funcName in ipairs(functions) do
        local func = Instance.new("RemoteFunction")
        func.Name = funcName
        func.Parent = eventsFolder
    end

    return eventsFolder
end

-- イベントを初期化
local eventsFolder = SetupReplicatedStorage()

-- モジュールを読み込み
local DataManager = require(script.Parent.DataManager)
local EnemySystem = require(script.Parent.EnemySystem)
local EventSystem = require(script.Parent.EventSystem)
local TradeSystem = require(script.Parent.TradeSystem)
local GameConfig = require(ReplicatedStorage.Shared.GameConfig)

-- プレイヤー参加時
Players.PlayerAdded:Connect(function(player)
    print("[MainServer] Player joined: " .. player.Name)

    -- データをロード
    local data = DataManager.LoadPlayerData(player)

    -- キャラクターセットアップ
    player.CharacterAdded:Connect(function(character)
        local evolution = GameConfig.GetEvolutionByLevel(data.Level)

        -- ヒューマノイドの設定
        local humanoid = character:WaitForChild("Humanoid")
        humanoid.MaxHealth = evolution.health
        humanoid.Health = evolution.health
        humanoid.WalkSpeed = evolution.speed

        -- キャラクターの色を変更
        for _, part in ipairs(character:GetDescendants()) do
            if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
                part.BrickColor = BrickColor.new(evolution.color)
            end
        end
    end)

    -- 最初の統計更新を送信
    eventsFolder.UpdateStats:FireClient(player, data)
end)

-- プレイヤー退出時
Players.PlayerRemoving:Connect(function(player)
    print("[MainServer] Player leaving: " .. player.Name)
    DataManager.CleanupPlayer(player)
end)

-- リモートファンクションのセットアップ
eventsFolder.GetPlayerData.OnServerInvoke = function(player)
    return DataManager.GetPlayerData(player)
end

eventsFolder.AttackEnemy.OnServerInvoke = function(player, enemyId)
    local data = DataManager.GetPlayerData(player)
    if not data then return false end

    local evolution = GameConfig.GetEvolutionByLevel(data.Level)
    local damage = evolution.damage

    return EnemySystem.DamageEnemy(player, enemyId, damage)
end

eventsFolder.ChangeEvolution.OnServerInvoke = function(player, evolutionId)
    local data = DataManager.GetPlayerData(player)
    if not data then return false end

    -- アンロック済みか確認
    local isUnlocked = false
    for _, unlockedId in ipairs(data.UnlockedEvolutions) do
        if unlockedId == evolutionId then
            isUnlocked = true
            break
        end
    end

    if not isUnlocked then
        return {success = false, error = "この進化形態はアンロックされていません"}
    end

    -- 進化を変更
    data.CurrentEvolution = evolutionId

    -- キャラクターを更新
    local character = player.Character
    if character then
        local evolution = nil
        for _, evo in ipairs(GameConfig.EVOLUTIONS) do
            if evo.id == evolutionId then
                evolution = evo
                break
            end
        end

        if evolution then
            local humanoid = character:FindFirstChild("Humanoid")
            if humanoid then
                humanoid.MaxHealth = evolution.health
                humanoid.Health = evolution.health
                humanoid.WalkSpeed = evolution.speed
            end

            for _, part in ipairs(character:GetDescendants()) do
                if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
                    part.BrickColor = BrickColor.new(evolution.color)
                end
            end
        end
    end

    eventsFolder.EvolutionChanged:FireClient(player, evolutionId)

    return {success = true}
end

eventsFolder.RequestTrade.OnServerInvoke = function(player, receiverName, offeredSecrets)
    local receiver = Players:FindFirstChild(receiverName)
    if not receiver then
        return {success = false, error = "プレイヤーが見つかりません"}
    end

    return TradeSystem.CreateTradeRequest(player, receiver, offeredSecrets)
end

eventsFolder.RespondTrade.OnServerInvoke = function(player, tradeId, accept, counterOffer)
    return TradeSystem.RespondToTrade(tradeId, accept, counterOffer)
end

eventsFolder.ConfirmTrade.OnServerInvoke = function(player, tradeId)
    return TradeSystem.ConfirmTrade(tradeId)
end

eventsFolder.CancelTrade.OnServerInvoke = function(player, tradeId)
    local trades = TradeSystem.GetPlayerActiveTrades(player)
    for _, trade in ipairs(trades) do
        if trade.id == tradeId then
            TradeSystem.CancelTrade(tradeId, "プレイヤーによるキャンセル")
            return true
        end
    end
    return false
end

eventsFolder.GetActiveEnemies.OnServerInvoke = function(player)
    local enemies = EnemySystem.GetActiveEnemies()
    local enemyData = {}

    for _, enemy in ipairs(enemies) do
        if enemy.model and enemy.model.PrimaryPart then
            table.insert(enemyData, {
                id = enemy.id,
                name = enemy.data.name,
                health = enemy.model:FindFirstChild("Humanoid") and enemy.model.Humanoid.Health or 0,
                maxHealth = enemy.data.health,
                position = enemy.model.PrimaryPart.Position
            })
        end
    end

    return enemyData
end

eventsFolder.GetCurrentEvent.OnServerInvoke = function(player)
    local event = EventSystem.GetCurrentEvent()
    if event then
        return {
            event = event,
            timeRemaining = EventSystem.GetEventTimeRemaining()
        }
    end
    return nil
end

-- システムを開始
EnemySystem.StartSpawnLoop()
EventSystem.StartHourlyEventLoop()

-- 統計更新ループ（30秒ごと）
task.spawn(function()
    while true do
        task.wait(30)
        for _, player in ipairs(Players:GetPlayers()) do
            local data = DataManager.GetPlayerData(player)
            if data then
                eventsFolder.UpdateStats:FireClient(player, data)
            end
        end
    end
end)

print("[MainServer] ブレインロット進化ゲームが開始されました！")
print("[MainServer] BrainRot Evolution Game Started!")
