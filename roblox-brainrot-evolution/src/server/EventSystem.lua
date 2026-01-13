--[[
    イベントシステム - 1時間ごとのイベント管理
    Event System - Hourly Event Management
]]

local Players = game:GetService("Players")

local GameConfig = require(game.ReplicatedStorage.Shared.GameConfig)

local EventSystem = {}

-- 現在のイベント
local CurrentEvent = nil
local EventEndTime = 0

-- イベント開始
function EventSystem.StartEvent(eventData)
    if not eventData then
        eventData = GameConfig.GetRandomEvent()
    end

    CurrentEvent = eventData
    EventEndTime = tick() + eventData.duration

    -- EnemySystemの倍率を更新
    local EnemySystem = require(script.Parent.EnemySystem)

    if eventData.effect.type == "exp_multiplier" then
        EnemySystem.ExpMultiplier = eventData.effect.value
    elseif eventData.effect.type == "coin_multiplier" then
        EnemySystem.CoinMultiplier = eventData.effect.value
    elseif eventData.effect.type == "boss_spawn" then
        EnemySystem.BossSpawnRate = eventData.effect.value
        -- ボスを即座にスポーン
        for i = 1, eventData.effect.value do
            local bossData = GameConfig.ENEMIES[math.random(4, 5)]
            EnemySystem.SpawnEnemy(nil, bossData)
        end
    elseif eventData.effect.type == "secret_multiplier" then
        EnemySystem.SecretMultiplier = eventData.effect.value
    elseif eventData.effect.type == "mega" then
        EnemySystem.ExpMultiplier = eventData.effect.value
        EnemySystem.CoinMultiplier = eventData.effect.value
        EnemySystem.SecretMultiplier = eventData.effect.value
        EnemySystem.BossSpawnRate = eventData.effect.value
    end

    -- 全プレイヤーに通知
    for _, player in ipairs(Players:GetPlayers()) do
        game.ReplicatedStorage.Events.EventStarted:FireClient(player, eventData)
    end

    print("[EventSystem] Event started: " .. eventData.name)

    -- イベント終了をスケジュール
    task.delay(eventData.duration, function()
        EventSystem.EndEvent()
    end)
end

-- イベント終了
function EventSystem.EndEvent()
    if not CurrentEvent then return end

    -- 倍率をリセット
    local EnemySystem = require(script.Parent.EnemySystem)
    EnemySystem.ExpMultiplier = 1
    EnemySystem.CoinMultiplier = 1
    EnemySystem.SecretMultiplier = 1
    EnemySystem.BossSpawnRate = 1

    -- 全プレイヤーに通知
    for _, player in ipairs(Players:GetPlayers()) do
        game.ReplicatedStorage.Events.EventEnded:FireClient(player, CurrentEvent)
    end

    print("[EventSystem] Event ended: " .. CurrentEvent.name)

    CurrentEvent = nil
end

-- 現在のイベントを取得
function EventSystem.GetCurrentEvent()
    return CurrentEvent
end

-- イベント残り時間を取得
function EventSystem.GetEventTimeRemaining()
    if not CurrentEvent then return 0 end
    return math.max(0, EventEndTime - tick())
end

-- 1時間イベントループを開始
function EventSystem.StartHourlyEventLoop()
    task.spawn(function()
        while true do
            -- 1時間（3600秒）待機
            task.wait(3600)

            -- プレイヤーがいる場合のみイベント開始
            if #Players:GetPlayers() > 0 then
                EventSystem.StartEvent()
            end
        end
    end)

    -- 最初のイベント（デモ用に30秒後）
    task.delay(30, function()
        if #Players:GetPlayers() > 0 then
            EventSystem.StartEvent()
        end
    end)
end

-- 次のイベントまでの時間を取得
function EventSystem.GetTimeUntilNextEvent()
    local currentMinute = os.date("*t").min
    local secondsUntilNextHour = (60 - currentMinute) * 60
    return secondsUntilNextHour
end

return EventSystem
