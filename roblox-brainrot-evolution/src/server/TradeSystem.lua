--[[
    トレードシステム - シークレット交換機能
    Trade System - Secret Trading Functionality
]]

local Players = game:GetService("Players")

local GameConfig = require(game.ReplicatedStorage.Shared.GameConfig)

local TradeSystem = {}

-- アクティブなトレードリクエスト
local ActiveTrades = {}
local TradeIdCounter = 0

-- トレードリクエストを作成
function TradeSystem.CreateTradeRequest(sender, receiver, offeredSecrets)
    -- バリデーション
    if not sender or not receiver then
        return {success = false, error = "無効なプレイヤー"}
    end

    if sender == receiver then
        return {success = false, error = "自分自身とはトレードできません"}
    end

    -- 送信者がシークレットを持っているか確認
    local DataManager = require(script.Parent.DataManager)
    local senderData = DataManager.GetPlayerData(sender)

    if not senderData then
        return {success = false, error = "データを取得できません"}
    end

    for secretId, count in pairs(offeredSecrets) do
        local owned = senderData.Secrets[secretId] or 0
        if owned < count then
            return {success = false, error = "シークレットが足りません"}
        end
    end

    -- トレードリクエストを作成
    TradeIdCounter = TradeIdCounter + 1
    local tradeId = TradeIdCounter

    local trade = {
        id = tradeId,
        sender = sender,
        receiver = receiver,
        senderOffer = offeredSecrets,
        receiverOffer = {},
        status = "pending", -- pending, accepted, completed, cancelled
        createdAt = tick()
    }

    ActiveTrades[tradeId] = trade

    -- 受信者に通知
    game.ReplicatedStorage.Events.TradeRequest:FireClient(receiver, {
        tradeId = tradeId,
        senderName = sender.Name,
        senderOffer = offeredSecrets
    })

    -- 30秒後に自動キャンセル
    task.delay(30, function()
        if ActiveTrades[tradeId] and ActiveTrades[tradeId].status == "pending" then
            TradeSystem.CancelTrade(tradeId, "タイムアウト")
        end
    end)

    return {success = true, tradeId = tradeId}
end

-- トレードリクエストに応答
function TradeSystem.RespondToTrade(tradeId, accept, counterOffer)
    local trade = ActiveTrades[tradeId]

    if not trade then
        return {success = false, error = "トレードが見つかりません"}
    end

    if trade.status ~= "pending" then
        return {success = false, error = "このトレードは既に処理されています"}
    end

    if not accept then
        TradeSystem.CancelTrade(tradeId, "拒否されました")
        return {success = true, cancelled = true}
    end

    -- カウンターオファーを設定
    trade.receiverOffer = counterOffer or {}

    -- 受信者がシークレットを持っているか確認
    local DataManager = require(script.Parent.DataManager)
    local receiverData = DataManager.GetPlayerData(trade.receiver)

    if not receiverData then
        return {success = false, error = "データを取得できません"}
    end

    for secretId, count in pairs(trade.receiverOffer) do
        local owned = receiverData.Secrets[secretId] or 0
        if owned < count then
            return {success = false, error = "シークレットが足りません"}
        end
    end

    trade.status = "accepted"

    -- 送信者に確認を求める
    game.ReplicatedStorage.Events.TradeAccepted:FireClient(trade.sender, {
        tradeId = tradeId,
        receiverName = trade.receiver.Name,
        receiverOffer = trade.receiverOffer
    })

    return {success = true, awaitingConfirmation = true}
end

-- トレードを確定
function TradeSystem.ConfirmTrade(tradeId)
    local trade = ActiveTrades[tradeId]

    if not trade then
        return {success = false, error = "トレードが見つかりません"}
    end

    if trade.status ~= "accepted" then
        return {success = false, error = "トレードは承認されていません"}
    end

    local DataManager = require(script.Parent.DataManager)
    local senderData = DataManager.GetPlayerData(trade.sender)
    local receiverData = DataManager.GetPlayerData(trade.receiver)

    if not senderData or not receiverData then
        return {success = false, error = "データを取得できません"}
    end

    -- 最終確認：両者がシークレットを持っているか
    for secretId, count in pairs(trade.senderOffer) do
        local owned = senderData.Secrets[secretId] or 0
        if owned < count then
            TradeSystem.CancelTrade(tradeId, "シークレット不足")
            return {success = false, error = "シークレットが足りません"}
        end
    end

    for secretId, count in pairs(trade.receiverOffer) do
        local owned = receiverData.Secrets[secretId] or 0
        if owned < count then
            TradeSystem.CancelTrade(tradeId, "シークレット不足")
            return {success = false, error = "シークレットが足りません"}
        end
    end

    -- シークレットを交換
    -- 送信者から受信者へ
    for secretId, count in pairs(trade.senderOffer) do
        senderData.Secrets[secretId] = senderData.Secrets[secretId] - count
        if senderData.Secrets[secretId] <= 0 then
            senderData.Secrets[secretId] = nil
        end

        if not receiverData.Secrets[secretId] then
            receiverData.Secrets[secretId] = 0
        end
        receiverData.Secrets[secretId] = receiverData.Secrets[secretId] + count
    end

    -- 受信者から送信者へ
    for secretId, count in pairs(trade.receiverOffer) do
        receiverData.Secrets[secretId] = receiverData.Secrets[secretId] - count
        if receiverData.Secrets[secretId] <= 0 then
            receiverData.Secrets[secretId] = nil
        end

        if not senderData.Secrets[secretId] then
            senderData.Secrets[secretId] = 0
        end
        senderData.Secrets[secretId] = senderData.Secrets[secretId] + count
    end

    -- トレード統計を更新
    senderData.TradeStats.TotalTrades = senderData.TradeStats.TotalTrades + 1
    receiverData.TradeStats.TotalTrades = receiverData.TradeStats.TotalTrades + 1

    -- トレード価値を計算
    local senderValue = 0
    local receiverValue = 0

    for secretId, count in pairs(trade.senderOffer) do
        for _, secret in ipairs(GameConfig.SECRETS) do
            if secret.id == secretId then
                senderValue = senderValue + (secret.tradeValue * count)
                break
            end
        end
    end

    for secretId, count in pairs(trade.receiverOffer) do
        for _, secret in ipairs(GameConfig.SECRETS) do
            if secret.id == secretId then
                receiverValue = receiverValue + (secret.tradeValue * count)
                break
            end
        end
    end

    senderData.TradeStats.TotalValueTraded = senderData.TradeStats.TotalValueTraded + senderValue
    receiverData.TradeStats.TotalValueTraded = receiverData.TradeStats.TotalValueTraded + receiverValue

    trade.status = "completed"

    -- 両者に通知
    game.ReplicatedStorage.Events.TradeCompleted:FireClient(trade.sender, {
        tradeId = tradeId,
        received = trade.receiverOffer,
        given = trade.senderOffer
    })

    game.ReplicatedStorage.Events.TradeCompleted:FireClient(trade.receiver, {
        tradeId = tradeId,
        received = trade.senderOffer,
        given = trade.receiverOffer
    })

    -- トレードをクリーンアップ
    task.delay(5, function()
        ActiveTrades[tradeId] = nil
    end)

    print("[TradeSystem] Trade completed between " .. trade.sender.Name .. " and " .. trade.receiver.Name)

    return {success = true}
end

-- トレードをキャンセル
function TradeSystem.CancelTrade(tradeId, reason)
    local trade = ActiveTrades[tradeId]

    if not trade then return end

    trade.status = "cancelled"

    -- 両者に通知
    if trade.sender and trade.sender.Parent then
        game.ReplicatedStorage.Events.TradeCancelled:FireClient(trade.sender, {
            tradeId = tradeId,
            reason = reason
        })
    end

    if trade.receiver and trade.receiver.Parent then
        game.ReplicatedStorage.Events.TradeCancelled:FireClient(trade.receiver, {
            tradeId = tradeId,
            reason = reason
        })
    end

    ActiveTrades[tradeId] = nil

    print("[TradeSystem] Trade cancelled: " .. reason)
end

-- プレイヤーのアクティブトレードを取得
function TradeSystem.GetPlayerActiveTrades(player)
    local trades = {}

    for _, trade in pairs(ActiveTrades) do
        if trade.sender == player or trade.receiver == player then
            table.insert(trades, trade)
        end
    end

    return trades
end

return TradeSystem
