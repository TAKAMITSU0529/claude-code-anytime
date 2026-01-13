--[[
    敵システム - 敵の生成、AI、戦闘処理
    Enemy System - Enemy Spawning, AI, Combat
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local GameConfig = require(game.ReplicatedStorage.Shared.GameConfig)

local EnemySystem = {}

-- アクティブな敵リスト
local ActiveEnemies = {}
local EnemyIdCounter = 0

-- スポーン設定
local MAX_ENEMIES = 20
local SPAWN_INTERVAL = 3
local SPAWN_RADIUS = 100

-- イベント倍率
EnemySystem.ExpMultiplier = 1
EnemySystem.CoinMultiplier = 1
EnemySystem.SecretMultiplier = 1
EnemySystem.BossSpawnRate = 1

-- 敵モデルを生成
local function CreateEnemyModel(enemyData, position)
    local model = Instance.new("Model")
    model.Name = "Enemy_" .. enemyData.name

    -- メインパーツ（体）
    local body = Instance.new("Part")
    body.Name = "HumanoidRootPart"
    body.Size = Vector3.new(4, 6, 4)
    body.Position = position
    body.Anchored = false
    body.CanCollide = true
    body.BrickColor = BrickColor.new("Bright red")
    body.Parent = model

    -- 頭（トイレ風）
    local head = Instance.new("Part")
    head.Name = "Head"
    head.Size = Vector3.new(3, 3, 3)
    head.Position = position + Vector3.new(0, 5, 0)
    head.Anchored = false
    head.CanCollide = false
    head.BrickColor = BrickColor.new("White")
    head.Shape = Enum.PartType.Ball
    head.Parent = model

    -- 溶接
    local weld = Instance.new("WeldConstraint")
    weld.Part0 = body
    weld.Part1 = head
    weld.Parent = body

    -- ヒューマノイド
    local humanoid = Instance.new("Humanoid")
    humanoid.MaxHealth = enemyData.health
    humanoid.Health = enemyData.health
    humanoid.WalkSpeed = 8
    humanoid.Parent = model

    -- 名前表示
    local billboardGui = Instance.new("BillboardGui")
    billboardGui.Size = UDim2.new(0, 200, 0, 50)
    billboardGui.StudsOffset = Vector3.new(0, 4, 0)
    billboardGui.Adornee = head
    billboardGui.Parent = head

    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 0.5, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = enemyData.name
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.TextStrokeTransparency = 0
    nameLabel.TextScaled = true
    nameLabel.Parent = billboardGui

    local healthBar = Instance.new("Frame")
    healthBar.Size = UDim2.new(1, 0, 0.3, 0)
    healthBar.Position = UDim2.new(0, 0, 0.6, 0)
    healthBar.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
    healthBar.BorderSizePixel = 0
    healthBar.Parent = billboardGui

    local healthFill = Instance.new("Frame")
    healthFill.Name = "HealthFill"
    healthFill.Size = UDim2.new(1, 0, 1, 0)
    healthFill.BackgroundColor3 = Color3.fromRGB(0, 255, 0)
    healthFill.BorderSizePixel = 0
    healthFill.Parent = healthBar

    model.PrimaryPart = body

    return model
end

-- 敵をスポーン
function EnemySystem.SpawnEnemy(position, forceEnemyData)
    if #ActiveEnemies >= MAX_ENEMIES then return nil end

    local enemyData = forceEnemyData or GameConfig.GetRandomEnemy()

    -- スポーン位置をランダム化
    if not position then
        local angle = math.random() * math.pi * 2
        local distance = math.random(20, SPAWN_RADIUS)
        position = Vector3.new(
            math.cos(angle) * distance,
            5,
            math.sin(angle) * distance
        )
    end

    EnemyIdCounter = EnemyIdCounter + 1
    local enemyId = EnemyIdCounter

    local model = CreateEnemyModel(enemyData, position)
    model:SetAttribute("EnemyId", enemyId)
    model:SetAttribute("EnemyDataId", enemyData.id)
    model:SetAttribute("Damage", enemyData.damage)
    model:SetAttribute("ExpReward", enemyData.expReward)
    model:SetAttribute("CoinReward", enemyData.coinReward)

    -- 敵フォルダに配置
    local enemyFolder = workspace:FindFirstChild("Enemies")
    if not enemyFolder then
        enemyFolder = Instance.new("Folder")
        enemyFolder.Name = "Enemies"
        enemyFolder.Parent = workspace
    end
    model.Parent = enemyFolder

    -- アクティブリストに追加
    local enemyInstance = {
        id = enemyId,
        model = model,
        data = enemyData,
        currentHealth = enemyData.health,
        lastAttackTime = 0
    }
    table.insert(ActiveEnemies, enemyInstance)

    -- ヘルス変更時の処理
    local humanoid = model:FindFirstChild("Humanoid")
    if humanoid then
        humanoid.HealthChanged:Connect(function(health)
            local healthFill = model:FindFirstChild("Head"):FindFirstChild("BillboardGui"):FindFirstChild("HealthFill", true)
            if healthFill then
                healthFill.Size = UDim2.new(health / enemyData.health, 0, 1, 0)
                if health / enemyData.health > 0.5 then
                    healthFill.BackgroundColor3 = Color3.fromRGB(0, 255, 0)
                elseif health / enemyData.health > 0.25 then
                    healthFill.BackgroundColor3 = Color3.fromRGB(255, 255, 0)
                else
                    healthFill.BackgroundColor3 = Color3.fromRGB(255, 0, 0)
                end
            end
        end)

        humanoid.Died:Connect(function()
            EnemySystem.OnEnemyDefeated(enemyInstance)
        end)
    end

    return enemyInstance
end

-- 敵が倒された時
function EnemySystem.OnEnemyDefeated(enemyInstance)
    local DataManager = require(script.Parent.DataManager)

    -- 最後にダメージを与えたプレイヤーに報酬
    local lastAttacker = enemyInstance.lastAttacker
    if lastAttacker and lastAttacker.Parent then
        local expReward = math.floor(enemyInstance.data.expReward * EnemySystem.ExpMultiplier)
        local coinReward = math.floor(enemyInstance.data.coinReward * EnemySystem.CoinMultiplier)

        DataManager.AddExp(lastAttacker, expReward)
        DataManager.AddCoins(lastAttacker, coinReward)

        -- 統計を更新
        local playerData = DataManager.GetPlayerData(lastAttacker)
        if playerData then
            playerData.Stats.TotalKills = playerData.Stats.TotalKills + 1
            if enemyInstance.data.id >= 4 then -- ボス以上
                playerData.Stats.BossesDefeated = playerData.Stats.BossesDefeated + 1
            end
        end

        -- シークレットドロップチェック
        for _, secret in ipairs(GameConfig.SECRETS) do
            local dropChance = secret.dropChance * EnemySystem.SecretMultiplier
            if math.random() < dropChance then
                DataManager.AddSecret(lastAttacker, secret.id)
                game.ReplicatedStorage.Events.SecretObtained:FireClient(lastAttacker, secret)
            end
        end

        -- クライアントに報酬を通知
        game.ReplicatedStorage.Events.RewardObtained:FireClient(lastAttacker, {
            exp = expReward,
            coins = coinReward
        })
    end

    -- リストから削除
    for i, enemy in ipairs(ActiveEnemies) do
        if enemy.id == enemyInstance.id then
            table.remove(ActiveEnemies, i)
            break
        end
    end

    -- モデルを削除
    task.delay(2, function()
        if enemyInstance.model and enemyInstance.model.Parent then
            enemyInstance.model:Destroy()
        end
    end)
end

-- 敵にダメージを与える
function EnemySystem.DamageEnemy(player, enemyId, damage)
    for _, enemy in ipairs(ActiveEnemies) do
        if enemy.id == enemyId then
            local humanoid = enemy.model:FindFirstChild("Humanoid")
            if humanoid then
                humanoid:TakeDamage(damage)
                enemy.lastAttacker = player

                -- 統計更新
                local DataManager = require(script.Parent.DataManager)
                local playerData = DataManager.GetPlayerData(player)
                if playerData then
                    playerData.Stats.TotalDamageDealt = playerData.Stats.TotalDamageDealt + damage
                end

                -- ダメージ表示イベント
                game.ReplicatedStorage.Events.DamageDealt:FireClient(player, {
                    enemyId = enemyId,
                    damage = damage,
                    position = enemy.model.PrimaryPart.Position
                })

                return true
            end
        end
    end
    return false
end

-- 敵AI更新
function EnemySystem.UpdateEnemyAI()
    local players = Players:GetPlayers()
    if #players == 0 then return end

    for _, enemy in ipairs(ActiveEnemies) do
        if enemy.model and enemy.model.PrimaryPart then
            -- 最も近いプレイヤーを探す
            local closestPlayer = nil
            local closestDistance = math.huge

            for _, player in ipairs(players) do
                local character = player.Character
                if character and character:FindFirstChild("HumanoidRootPart") then
                    local distance = (character.HumanoidRootPart.Position - enemy.model.PrimaryPart.Position).Magnitude
                    if distance < closestDistance then
                        closestDistance = distance
                        closestPlayer = player
                    end
                end
            end

            -- 追跡と攻撃
            if closestPlayer and closestPlayer.Character then
                local humanoid = enemy.model:FindFirstChild("Humanoid")
                local targetHumanoid = closestPlayer.Character:FindFirstChild("Humanoid")

                if humanoid and targetHumanoid then
                    if closestDistance <= 5 then
                        -- 攻撃範囲内
                        local currentTime = tick()
                        if currentTime - enemy.lastAttackTime >= 1 then
                            enemy.lastAttackTime = currentTime
                            targetHumanoid:TakeDamage(enemy.data.damage)

                            game.ReplicatedStorage.Events.PlayerDamaged:FireClient(closestPlayer, {
                                damage = enemy.data.damage,
                                enemyName = enemy.data.name
                            })
                        end
                    else
                        -- 追跡
                        humanoid:MoveTo(closestPlayer.Character.HumanoidRootPart.Position)
                    end
                end
            end
        end
    end
end

-- スポーンループ開始
function EnemySystem.StartSpawnLoop()
    task.spawn(function()
        while true do
            task.wait(SPAWN_INTERVAL)

            if #Players:GetPlayers() > 0 then
                -- ボススポーン率に応じてスポーン
                local bossChance = 0.05 * EnemySystem.BossSpawnRate
                if math.random() < bossChance then
                    local bossData = GameConfig.ENEMIES[math.random(4, 5)] -- ボスかタイタン
                    EnemySystem.SpawnEnemy(nil, bossData)
                else
                    EnemySystem.SpawnEnemy()
                end
            end
        end
    end)

    -- AI更新ループ
    RunService.Heartbeat:Connect(function()
        EnemySystem.UpdateEnemyAI()
    end)
end

-- アクティブな敵を取得
function EnemySystem.GetActiveEnemies()
    return ActiveEnemies
end

-- すべての敵をクリア
function EnemySystem.ClearAllEnemies()
    for _, enemy in ipairs(ActiveEnemies) do
        if enemy.model and enemy.model.Parent then
            enemy.model:Destroy()
        end
    end
    ActiveEnemies = {}
end

return EnemySystem
