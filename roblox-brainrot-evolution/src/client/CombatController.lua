--[[
    戦闘コントローラー - プレイヤーの攻撃処理
    Combat Controller - Player Attack Handling

    このスクリプトをStarterPlayer/StarterPlayerScripts内のLocalScriptに配置
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local Events = ReplicatedStorage:WaitForChild("Events")

-- 攻撃設定
local ATTACK_RANGE = 10
local ATTACK_COOLDOWN = 0.5

local lastAttackTime = 0
local isAttacking = false

-- 攻撃アニメーション（簡易版）
local function PlayAttackAnimation()
    local character = player.Character
    if not character then return end

    local humanoid = character:FindFirstChild("Humanoid")
    if not humanoid then return end

    -- 簡単なアニメーション効果
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if rootPart then
        -- 攻撃エフェクト
        local effect = Instance.new("Part")
        effect.Name = "AttackEffect"
        effect.Size = Vector3.new(2, 2, 2)
        effect.Position = rootPart.Position + rootPart.CFrame.LookVector * 3
        effect.Anchored = true
        effect.CanCollide = false
        effect.Transparency = 0.5
        effect.BrickColor = BrickColor.new("Bright yellow")
        effect.Shape = Enum.PartType.Ball
        effect.Parent = workspace

        -- エフェクトを拡大して消える
        task.spawn(function()
            for i = 1, 10 do
                effect.Size = effect.Size + Vector3.new(0.5, 0.5, 0.5)
                effect.Transparency = effect.Transparency + 0.05
                task.wait(0.02)
            end
            effect:Destroy()
        end)
    end
end

-- 最も近い敵を探す
local function FindNearestEnemy()
    local character = player.Character
    if not character then return nil end

    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return nil end

    local enemyFolder = workspace:FindFirstChild("Enemies")
    if not enemyFolder then return nil end

    local nearestEnemy = nil
    local nearestDistance = ATTACK_RANGE

    for _, enemy in ipairs(enemyFolder:GetChildren()) do
        if enemy:IsA("Model") and enemy.PrimaryPart then
            local distance = (enemy.PrimaryPart.Position - rootPart.Position).Magnitude
            if distance < nearestDistance then
                nearestDistance = distance
                nearestEnemy = enemy
            end
        end
    end

    return nearestEnemy
end

-- 攻撃実行
local function PerformAttack()
    local currentTime = tick()
    if currentTime - lastAttackTime < ATTACK_COOLDOWN then return end

    local nearestEnemy = FindNearestEnemy()
    if not nearestEnemy then return end

    local enemyId = nearestEnemy:GetAttribute("EnemyId")
    if not enemyId then return end

    lastAttackTime = currentTime

    -- 攻撃アニメーション
    PlayAttackAnimation()

    -- サーバーに攻撃を送信
    Events.AttackEnemy:InvokeServer(enemyId)
end

-- 入力処理
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end

    -- マウス左クリックまたはスペースキーで攻撃
    if input.UserInputType == Enum.UserInputType.MouseButton1 or
       input.KeyCode == Enum.KeyCode.Space then
        PerformAttack()
    end
end)

-- タッチ入力（モバイル対応）
UserInputService.TouchTap:Connect(function(touchPositions, gameProcessed)
    if gameProcessed then return end
    PerformAttack()
end)

-- 自動攻撃（オプション）
local autoAttackEnabled = false

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end

    -- Qキーで自動攻撃切り替え
    if input.KeyCode == Enum.KeyCode.Q then
        autoAttackEnabled = not autoAttackEnabled
        print(autoAttackEnabled and "自動攻撃: ON" or "自動攻撃: OFF")
    end
end)

RunService.Heartbeat:Connect(function()
    if autoAttackEnabled then
        PerformAttack()
    end
end)

-- ターゲットインジケーター
local targetIndicator = nil

local function UpdateTargetIndicator()
    local nearestEnemy = FindNearestEnemy()

    if nearestEnemy and nearestEnemy.PrimaryPart then
        if not targetIndicator then
            targetIndicator = Instance.new("SelectionBox")
            targetIndicator.Color3 = Color3.fromRGB(255, 0, 0)
            targetIndicator.LineThickness = 0.05
            targetIndicator.Parent = player.PlayerGui
        end
        targetIndicator.Adornee = nearestEnemy.PrimaryPart
    else
        if targetIndicator then
            targetIndicator.Adornee = nil
        end
    end
end

RunService.RenderStepped:Connect(UpdateTargetIndicator)

-- 敵との距離表示
local function CreateDistanceDisplay()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "DistanceDisplay"
    screenGui.Parent = player.PlayerGui

    local distanceLabel = Instance.new("TextLabel")
    distanceLabel.Name = "DistanceLabel"
    distanceLabel.Size = UDim2.new(0, 150, 0, 30)
    distanceLabel.Position = UDim2.new(0.5, -75, 0.9, 0)
    distanceLabel.BackgroundTransparency = 0.5
    distanceLabel.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    distanceLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    distanceLabel.TextScaled = true
    distanceLabel.Font = Enum.Font.GothamBold
    distanceLabel.Parent = screenGui

    Instance.new("UICorner", distanceLabel).CornerRadius = UDim.new(0, 5)

    RunService.RenderStepped:Connect(function()
        local nearestEnemy = FindNearestEnemy()
        if nearestEnemy and nearestEnemy.PrimaryPart then
            local character = player.Character
            if character and character:FindFirstChild("HumanoidRootPart") then
                local distance = (nearestEnemy.PrimaryPart.Position - character.HumanoidRootPart.Position).Magnitude
                distanceLabel.Text = string.format("距離: %.1fm", distance)
                distanceLabel.Visible = true

                if distance <= ATTACK_RANGE then
                    distanceLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
                else
                    distanceLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
                end
            end
        else
            distanceLabel.Text = "敵なし"
            distanceLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
        end
    end)
end

CreateDistanceDisplay()

print("[CombatController] 戦闘コントローラー初期化完了！")
print("[CombatController] 攻撃: マウス左クリック または スペースキー")
print("[CombatController] 自動攻撃切り替え: Qキー")
