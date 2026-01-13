--[[
    メインUI - ゲームのユーザーインターフェース
    Main UI - Game User Interface

    このスクリプトをStarterGui内のLocalScriptに配置
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- イベントとファンクションへの参照
local Events = ReplicatedStorage:WaitForChild("Events")
local GameConfig = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("GameConfig"))

-- メインScreenGui
local function CreateMainUI()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "BrainRotEvolutionUI"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = playerGui

    -- ============================================
    -- ステータスバー（上部）
    -- ============================================
    local topBar = Instance.new("Frame")
    topBar.Name = "TopBar"
    topBar.Size = UDim2.new(1, 0, 0, 60)
    topBar.Position = UDim2.new(0, 0, 0, 0)
    topBar.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    topBar.BorderSizePixel = 0
    topBar.Parent = screenGui

    local topGradient = Instance.new("UIGradient")
    topGradient.Color = ColorSequence.new{
        ColorSequenceKeypoint.new(0, Color3.fromRGB(40, 40, 60)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(20, 20, 30))
    }
    topGradient.Parent = topBar

    -- レベル表示
    local levelFrame = Instance.new("Frame")
    levelFrame.Name = "LevelFrame"
    levelFrame.Size = UDim2.new(0, 150, 0, 50)
    levelFrame.Position = UDim2.new(0, 10, 0, 5)
    levelFrame.BackgroundColor3 = Color3.fromRGB(50, 50, 70)
    levelFrame.BorderSizePixel = 0
    levelFrame.Parent = topBar

    Instance.new("UICorner", levelFrame).CornerRadius = UDim.new(0, 8)

    local levelLabel = Instance.new("TextLabel")
    levelLabel.Name = "LevelLabel"
    levelLabel.Size = UDim2.new(1, 0, 0.5, 0)
    levelLabel.BackgroundTransparency = 1
    levelLabel.Text = "レベル 1"
    levelLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelLabel.TextScaled = true
    levelLabel.Font = Enum.Font.GothamBold
    levelLabel.Parent = levelFrame

    -- EXPバー
    local expBarBg = Instance.new("Frame")
    expBarBg.Name = "ExpBarBg"
    expBarBg.Size = UDim2.new(0.9, 0, 0.3, 0)
    expBarBg.Position = UDim2.new(0.05, 0, 0.6, 0)
    expBarBg.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    expBarBg.BorderSizePixel = 0
    expBarBg.Parent = levelFrame

    Instance.new("UICorner", expBarBg).CornerRadius = UDim.new(0, 4)

    local expBarFill = Instance.new("Frame")
    expBarFill.Name = "ExpBarFill"
    expBarFill.Size = UDim2.new(0, 0, 1, 0)
    expBarFill.BackgroundColor3 = Color3.fromRGB(100, 200, 255)
    expBarFill.BorderSizePixel = 0
    expBarFill.Parent = expBarBg

    Instance.new("UICorner", expBarFill).CornerRadius = UDim.new(0, 4)

    -- コイン表示
    local coinFrame = Instance.new("Frame")
    coinFrame.Name = "CoinFrame"
    coinFrame.Size = UDim2.new(0, 120, 0, 40)
    coinFrame.Position = UDim2.new(0, 170, 0, 10)
    coinFrame.BackgroundColor3 = Color3.fromRGB(255, 200, 50)
    coinFrame.BorderSizePixel = 0
    coinFrame.Parent = topBar

    Instance.new("UICorner", coinFrame).CornerRadius = UDim.new(0, 8)

    local coinLabel = Instance.new("TextLabel")
    coinLabel.Name = "CoinLabel"
    coinLabel.Size = UDim2.new(1, 0, 1, 0)
    coinLabel.BackgroundTransparency = 1
    coinLabel.Text = "0"
    coinLabel.TextColor3 = Color3.fromRGB(50, 50, 50)
    coinLabel.TextScaled = true
    coinLabel.Font = Enum.Font.GothamBold
    coinLabel.Parent = coinFrame

    -- 進化形態表示
    local evolutionFrame = Instance.new("Frame")
    evolutionFrame.Name = "EvolutionFrame"
    evolutionFrame.Size = UDim2.new(0, 200, 0, 50)
    evolutionFrame.Position = UDim2.new(1, -210, 0, 5)
    evolutionFrame.BackgroundColor3 = Color3.fromRGB(150, 150, 150)
    evolutionFrame.BorderSizePixel = 0
    evolutionFrame.Parent = topBar

    Instance.new("UICorner", evolutionFrame).CornerRadius = UDim.new(0, 8)

    local evolutionLabel = Instance.new("TextLabel")
    evolutionLabel.Name = "EvolutionLabel"
    evolutionLabel.Size = UDim2.new(1, 0, 1, 0)
    evolutionLabel.BackgroundTransparency = 1
    evolutionLabel.Text = "スキビディトイレ"
    evolutionLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    evolutionLabel.TextScaled = true
    evolutionLabel.Font = Enum.Font.GothamBold
    evolutionLabel.Parent = evolutionFrame

    -- ============================================
    -- イベントバナー
    -- ============================================
    local eventBanner = Instance.new("Frame")
    eventBanner.Name = "EventBanner"
    eventBanner.Size = UDim2.new(0, 400, 0, 60)
    eventBanner.Position = UDim2.new(0.5, -200, 0, 70)
    eventBanner.BackgroundColor3 = Color3.fromRGB(255, 100, 100)
    eventBanner.BorderSizePixel = 0
    eventBanner.Visible = false
    eventBanner.Parent = screenGui

    Instance.new("UICorner", eventBanner).CornerRadius = UDim.new(0, 10)

    local eventGradient = Instance.new("UIGradient")
    eventGradient.Color = ColorSequence.new{
        ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 150, 50)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(255, 50, 100))
    }
    eventGradient.Parent = eventBanner

    local eventLabel = Instance.new("TextLabel")
    eventLabel.Name = "EventLabel"
    eventLabel.Size = UDim2.new(1, 0, 0.6, 0)
    eventLabel.BackgroundTransparency = 1
    eventLabel.Text = "イベント開催中！"
    eventLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    eventLabel.TextScaled = true
    eventLabel.Font = Enum.Font.GothamBold
    eventLabel.Parent = eventBanner

    local eventTimerLabel = Instance.new("TextLabel")
    eventTimerLabel.Name = "EventTimerLabel"
    eventTimerLabel.Size = UDim2.new(1, 0, 0.4, 0)
    eventTimerLabel.Position = UDim2.new(0, 0, 0.6, 0)
    eventTimerLabel.BackgroundTransparency = 1
    eventTimerLabel.Text = "残り時間: 10:00"
    eventTimerLabel.TextColor3 = Color3.fromRGB(255, 255, 200)
    eventTimerLabel.TextScaled = true
    eventTimerLabel.Font = Enum.Font.Gotham
    eventTimerLabel.Parent = eventBanner

    -- ============================================
    -- サイドメニュー（右）
    -- ============================================
    local sideMenu = Instance.new("Frame")
    sideMenu.Name = "SideMenu"
    sideMenu.Size = UDim2.new(0, 60, 0, 300)
    sideMenu.Position = UDim2.new(1, -70, 0.5, -150)
    sideMenu.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
    sideMenu.BorderSizePixel = 0
    sideMenu.Parent = screenGui

    Instance.new("UICorner", sideMenu).CornerRadius = UDim.new(0, 10)

    local menuLayout = Instance.new("UIListLayout")
    menuLayout.Padding = UDim.new(0, 10)
    menuLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    menuLayout.VerticalAlignment = Enum.VerticalAlignment.Center
    menuLayout.Parent = sideMenu

    -- メニューボタン作成関数
    local function CreateMenuButton(name, text, color)
        local button = Instance.new("TextButton")
        button.Name = name
        button.Size = UDim2.new(0, 50, 0, 50)
        button.BackgroundColor3 = color
        button.Text = text
        button.TextColor3 = Color3.fromRGB(255, 255, 255)
        button.TextScaled = true
        button.Font = Enum.Font.GothamBold
        button.Parent = sideMenu

        Instance.new("UICorner", button).CornerRadius = UDim.new(0, 8)

        return button
    end

    local evolutionBtn = CreateMenuButton("EvolutionBtn", "進", Color3.fromRGB(100, 100, 200))
    local secretsBtn = CreateMenuButton("SecretsBtn", "秘", Color3.fromRGB(200, 100, 200))
    local tradeBtn = CreateMenuButton("TradeBtn", "交", Color3.fromRGB(100, 200, 100))
    local statsBtn = CreateMenuButton("StatsBtn", "統", Color3.fromRGB(200, 150, 50))

    -- ============================================
    -- 進化選択パネル
    -- ============================================
    local evolutionPanel = Instance.new("Frame")
    evolutionPanel.Name = "EvolutionPanel"
    evolutionPanel.Size = UDim2.new(0, 400, 0, 500)
    evolutionPanel.Position = UDim2.new(0.5, -200, 0.5, -250)
    evolutionPanel.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    evolutionPanel.BorderSizePixel = 0
    evolutionPanel.Visible = false
    evolutionPanel.Parent = screenGui

    Instance.new("UICorner", evolutionPanel).CornerRadius = UDim.new(0, 15)

    local evolutionTitle = Instance.new("TextLabel")
    evolutionTitle.Size = UDim2.new(1, 0, 0, 50)
    evolutionTitle.BackgroundTransparency = 1
    evolutionTitle.Text = "進化形態"
    evolutionTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
    evolutionTitle.TextScaled = true
    evolutionTitle.Font = Enum.Font.GothamBold
    evolutionTitle.Parent = evolutionPanel

    local evolutionScroll = Instance.new("ScrollingFrame")
    evolutionScroll.Name = "EvolutionScroll"
    evolutionScroll.Size = UDim2.new(1, -20, 1, -100)
    evolutionScroll.Position = UDim2.new(0, 10, 0, 50)
    evolutionScroll.BackgroundTransparency = 1
    evolutionScroll.ScrollBarThickness = 6
    evolutionScroll.Parent = evolutionPanel

    local evolutionListLayout = Instance.new("UIListLayout")
    evolutionListLayout.Padding = UDim.new(0, 10)
    evolutionListLayout.Parent = evolutionScroll

    local closeEvoBtn = Instance.new("TextButton")
    closeEvoBtn.Name = "CloseBtn"
    closeEvoBtn.Size = UDim2.new(0, 30, 0, 30)
    closeEvoBtn.Position = UDim2.new(1, -35, 0, 5)
    closeEvoBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
    closeEvoBtn.Text = "X"
    closeEvoBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeEvoBtn.TextScaled = true
    closeEvoBtn.Font = Enum.Font.GothamBold
    closeEvoBtn.Parent = evolutionPanel

    Instance.new("UICorner", closeEvoBtn).CornerRadius = UDim.new(0, 5)

    -- ============================================
    -- シークレットパネル
    -- ============================================
    local secretsPanel = Instance.new("Frame")
    secretsPanel.Name = "SecretsPanel"
    secretsPanel.Size = UDim2.new(0, 400, 0, 400)
    secretsPanel.Position = UDim2.new(0.5, -200, 0.5, -200)
    secretsPanel.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    secretsPanel.BorderSizePixel = 0
    secretsPanel.Visible = false
    secretsPanel.Parent = screenGui

    Instance.new("UICorner", secretsPanel).CornerRadius = UDim.new(0, 15)

    local secretsTitle = Instance.new("TextLabel")
    secretsTitle.Size = UDim2.new(1, 0, 0, 50)
    secretsTitle.BackgroundTransparency = 1
    secretsTitle.Text = "シークレット"
    secretsTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
    secretsTitle.TextScaled = true
    secretsTitle.Font = Enum.Font.GothamBold
    secretsTitle.Parent = secretsPanel

    local secretsScroll = Instance.new("ScrollingFrame")
    secretsScroll.Name = "SecretsScroll"
    secretsScroll.Size = UDim2.new(1, -20, 1, -100)
    secretsScroll.Position = UDim2.new(0, 10, 0, 50)
    secretsScroll.BackgroundTransparency = 1
    secretsScroll.ScrollBarThickness = 6
    secretsScroll.Parent = secretsPanel

    local secretsListLayout = Instance.new("UIListLayout")
    secretsListLayout.Padding = UDim.new(0, 10)
    secretsListLayout.Parent = secretsScroll

    local closeSecretsBtn = Instance.new("TextButton")
    closeSecretsBtn.Name = "CloseBtn"
    closeSecretsBtn.Size = UDim2.new(0, 30, 0, 30)
    closeSecretsBtn.Position = UDim2.new(1, -35, 0, 5)
    closeSecretsBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
    closeSecretsBtn.Text = "X"
    closeSecretsBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeSecretsBtn.TextScaled = true
    closeSecretsBtn.Font = Enum.Font.GothamBold
    closeSecretsBtn.Parent = secretsPanel

    Instance.new("UICorner", closeSecretsBtn).CornerRadius = UDim.new(0, 5)

    -- ============================================
    -- トレードパネル
    -- ============================================
    local tradePanel = Instance.new("Frame")
    tradePanel.Name = "TradePanel"
    tradePanel.Size = UDim2.new(0, 500, 0, 400)
    tradePanel.Position = UDim2.new(0.5, -250, 0.5, -200)
    tradePanel.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    tradePanel.BorderSizePixel = 0
    tradePanel.Visible = false
    tradePanel.Parent = screenGui

    Instance.new("UICorner", tradePanel).CornerRadius = UDim.new(0, 15)

    local tradeTitle = Instance.new("TextLabel")
    tradeTitle.Size = UDim2.new(1, 0, 0, 50)
    tradeTitle.BackgroundTransparency = 1
    tradeTitle.Text = "シークレット交換"
    tradeTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
    tradeTitle.TextScaled = true
    tradeTitle.Font = Enum.Font.GothamBold
    tradeTitle.Parent = tradePanel

    local playerListFrame = Instance.new("Frame")
    playerListFrame.Name = "PlayerList"
    playerListFrame.Size = UDim2.new(0.4, 0, 0.7, 0)
    playerListFrame.Position = UDim2.new(0.05, 0, 0.15, 0)
    playerListFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 50)
    playerListFrame.Parent = tradePanel

    Instance.new("UICorner", playerListFrame).CornerRadius = UDim.new(0, 8)

    local closeTradeBtn = Instance.new("TextButton")
    closeTradeBtn.Name = "CloseBtn"
    closeTradeBtn.Size = UDim2.new(0, 30, 0, 30)
    closeTradeBtn.Position = UDim2.new(1, -35, 0, 5)
    closeTradeBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
    closeTradeBtn.Text = "X"
    closeTradeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeTradeBtn.TextScaled = true
    closeTradeBtn.Font = Enum.Font.GothamBold
    closeTradeBtn.Parent = tradePanel

    Instance.new("UICorner", closeTradeBtn).CornerRadius = UDim.new(0, 5)

    -- ============================================
    -- 統計パネル
    -- ============================================
    local statsPanel = Instance.new("Frame")
    statsPanel.Name = "StatsPanel"
    statsPanel.Size = UDim2.new(0, 350, 0, 400)
    statsPanel.Position = UDim2.new(0.5, -175, 0.5, -200)
    statsPanel.BackgroundColor3 = Color3.fromRGB(30, 30, 40)
    statsPanel.BorderSizePixel = 0
    statsPanel.Visible = false
    statsPanel.Parent = screenGui

    Instance.new("UICorner", statsPanel).CornerRadius = UDim.new(0, 15)

    local statsTitle = Instance.new("TextLabel")
    statsTitle.Size = UDim2.new(1, 0, 0, 50)
    statsTitle.BackgroundTransparency = 1
    statsTitle.Text = "統計"
    statsTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
    statsTitle.TextScaled = true
    statsTitle.Font = Enum.Font.GothamBold
    statsTitle.Parent = statsPanel

    local statsContent = Instance.new("TextLabel")
    statsContent.Name = "StatsContent"
    statsContent.Size = UDim2.new(0.9, 0, 0.8, 0)
    statsContent.Position = UDim2.new(0.05, 0, 0.15, 0)
    statsContent.BackgroundTransparency = 1
    statsContent.Text = "読み込み中..."
    statsContent.TextColor3 = Color3.fromRGB(255, 255, 255)
    statsContent.TextScaled = true
    statsContent.TextXAlignment = Enum.TextXAlignment.Left
    statsContent.TextYAlignment = Enum.TextYAlignment.Top
    statsContent.Font = Enum.Font.Gotham
    statsContent.Parent = statsPanel

    local closeStatsBtn = Instance.new("TextButton")
    closeStatsBtn.Name = "CloseBtn"
    closeStatsBtn.Size = UDim2.new(0, 30, 0, 30)
    closeStatsBtn.Position = UDim2.new(1, -35, 0, 5)
    closeStatsBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
    closeStatsBtn.Text = "X"
    closeStatsBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
    closeStatsBtn.TextScaled = true
    closeStatsBtn.Font = Enum.Font.GothamBold
    closeStatsBtn.Parent = statsPanel

    Instance.new("UICorner", closeStatsBtn).CornerRadius = UDim.new(0, 5)

    -- ============================================
    -- レベルアップ通知
    -- ============================================
    local levelUpNotif = Instance.new("Frame")
    levelUpNotif.Name = "LevelUpNotification"
    levelUpNotif.Size = UDim2.new(0, 300, 0, 100)
    levelUpNotif.Position = UDim2.new(0.5, -150, 0.3, 0)
    levelUpNotif.BackgroundColor3 = Color3.fromRGB(100, 200, 255)
    levelUpNotif.BorderSizePixel = 0
    levelUpNotif.Visible = false
    levelUpNotif.Parent = screenGui

    Instance.new("UICorner", levelUpNotif).CornerRadius = UDim.new(0, 15)

    local levelUpLabel = Instance.new("TextLabel")
    levelUpLabel.Name = "LevelUpLabel"
    levelUpLabel.Size = UDim2.new(1, 0, 1, 0)
    levelUpLabel.BackgroundTransparency = 1
    levelUpLabel.Text = "レベルアップ！\nLv. 1"
    levelUpLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    levelUpLabel.TextScaled = true
    levelUpLabel.Font = Enum.Font.GothamBold
    levelUpLabel.Parent = levelUpNotif

    -- ============================================
    -- ダメージ数表示用
    -- ============================================
    local damageContainer = Instance.new("Folder")
    damageContainer.Name = "DamageNumbers"
    damageContainer.Parent = screenGui

    return screenGui
end

-- UIを作成
local mainUI = CreateMainUI()

-- UI要素への参照
local topBar = mainUI:WaitForChild("TopBar")
local levelFrame = topBar:WaitForChild("LevelFrame")
local levelLabel = levelFrame:WaitForChild("LevelLabel")
local expBarFill = levelFrame:WaitForChild("ExpBarBg"):WaitForChild("ExpBarFill")
local coinLabel = topBar:WaitForChild("CoinFrame"):WaitForChild("CoinLabel")
local evolutionFrame = topBar:WaitForChild("EvolutionFrame")
local evolutionLabel = evolutionFrame:WaitForChild("EvolutionLabel")
local eventBanner = mainUI:WaitForChild("EventBanner")
local eventLabel = eventBanner:WaitForChild("EventLabel")
local eventTimerLabel = eventBanner:WaitForChild("EventTimerLabel")

local sideMenu = mainUI:WaitForChild("SideMenu")
local evolutionPanel = mainUI:WaitForChild("EvolutionPanel")
local secretsPanel = mainUI:WaitForChild("SecretsPanel")
local tradePanel = mainUI:WaitForChild("TradePanel")
local statsPanel = mainUI:WaitForChild("StatsPanel")
local levelUpNotif = mainUI:WaitForChild("LevelUpNotification")
local damageContainer = mainUI:WaitForChild("DamageNumbers")

-- 現在のプレイヤーデータ
local playerData = nil

-- UIを更新
local function UpdateUI(data)
    if not data then return end
    playerData = data

    -- レベル
    levelLabel.Text = "Lv. " .. data.Level

    -- EXP
    local expRequired = GameConfig.GetExpForLevel(data.Level + 1)
    local expPercent = data.Exp / expRequired
    TweenService:Create(expBarFill, TweenInfo.new(0.3), {Size = UDim2.new(expPercent, 0, 1, 0)}):Play()

    -- コイン
    coinLabel.Text = tostring(data.Coins)

    -- 進化形態
    local evolution = nil
    for _, evo in ipairs(GameConfig.EVOLUTIONS) do
        if evo.id == data.CurrentEvolution then
            evolution = evo
            break
        end
    end

    if evolution then
        evolutionLabel.Text = evolution.name
        evolutionFrame.BackgroundColor3 = evolution.color
    end
end

-- 進化選択パネルを更新
local function UpdateEvolutionPanel(data)
    local scroll = evolutionPanel:WaitForChild("EvolutionScroll")

    -- 既存の要素をクリア
    for _, child in ipairs(scroll:GetChildren()) do
        if child:IsA("Frame") then
            child:Destroy()
        end
    end

    for _, evolution in ipairs(GameConfig.EVOLUTIONS) do
        local isUnlocked = false
        for _, unlockedId in ipairs(data.UnlockedEvolutions) do
            if unlockedId == evolution.id then
                isUnlocked = true
                break
            end
        end

        local frame = Instance.new("Frame")
        frame.Size = UDim2.new(1, -10, 0, 60)
        frame.BackgroundColor3 = isUnlocked and evolution.color or Color3.fromRGB(50, 50, 50)
        frame.Parent = scroll

        Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)

        local nameLabel = Instance.new("TextLabel")
        nameLabel.Size = UDim2.new(0.6, 0, 0.5, 0)
        nameLabel.Position = UDim2.new(0.05, 0, 0.1, 0)
        nameLabel.BackgroundTransparency = 1
        nameLabel.Text = evolution.name
        nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
        nameLabel.TextScaled = true
        nameLabel.TextXAlignment = Enum.TextXAlignment.Left
        nameLabel.Font = Enum.Font.GothamBold
        nameLabel.Parent = frame

        local infoLabel = Instance.new("TextLabel")
        infoLabel.Size = UDim2.new(0.9, 0, 0.4, 0)
        infoLabel.Position = UDim2.new(0.05, 0, 0.55, 0)
        infoLabel.BackgroundTransparency = 1
        infoLabel.Text = isUnlocked and
            string.format("DMG: %d | HP: %d | SPD: %d", evolution.damage, evolution.health, evolution.speed) or
            string.format("Lv.%d で解放", evolution.unlockLevel)
        infoLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
        infoLabel.TextScaled = true
        infoLabel.TextXAlignment = Enum.TextXAlignment.Left
        infoLabel.Font = Enum.Font.Gotham
        infoLabel.Parent = frame

        if isUnlocked and evolution.id ~= data.CurrentEvolution then
            local selectBtn = Instance.new("TextButton")
            selectBtn.Size = UDim2.new(0, 60, 0, 30)
            selectBtn.Position = UDim2.new(1, -70, 0.5, -15)
            selectBtn.BackgroundColor3 = Color3.fromRGB(50, 150, 50)
            selectBtn.Text = "選択"
            selectBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
            selectBtn.TextScaled = true
            selectBtn.Font = Enum.Font.GothamBold
            selectBtn.Parent = frame

            Instance.new("UICorner", selectBtn).CornerRadius = UDim.new(0, 5)

            selectBtn.MouseButton1Click:Connect(function()
                Events.ChangeEvolution:InvokeServer(evolution.id)
            end)
        elseif evolution.id == data.CurrentEvolution then
            local currentLabel = Instance.new("TextLabel")
            currentLabel.Size = UDim2.new(0, 60, 0, 30)
            currentLabel.Position = UDim2.new(1, -70, 0.5, -15)
            currentLabel.BackgroundTransparency = 1
            currentLabel.Text = "装備中"
            currentLabel.TextColor3 = Color3.fromRGB(255, 255, 100)
            currentLabel.TextScaled = true
            currentLabel.Font = Enum.Font.GothamBold
            currentLabel.Parent = frame
        end
    end

    scroll.CanvasSize = UDim2.new(0, 0, 0, #GameConfig.EVOLUTIONS * 70)
end

-- シークレットパネルを更新
local function UpdateSecretsPanel(data)
    local scroll = secretsPanel:WaitForChild("SecretsScroll")

    -- 既存の要素をクリア
    for _, child in ipairs(scroll:GetChildren()) do
        if child:IsA("Frame") then
            child:Destroy()
        end
    end

    local hasSecrets = false
    for _, secret in ipairs(GameConfig.SECRETS) do
        local count = data.Secrets[secret.id] or 0
        if count > 0 then
            hasSecrets = true

            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(1, -10, 0, 50)
            frame.BackgroundColor3 = GameConfig.RARITY_COLORS[secret.rarity]
            frame.Parent = scroll

            Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 8)

            local nameLabel = Instance.new("TextLabel")
            nameLabel.Size = UDim2.new(0.7, 0, 1, 0)
            nameLabel.Position = UDim2.new(0.05, 0, 0, 0)
            nameLabel.BackgroundTransparency = 1
            nameLabel.Text = secret.name .. " [" .. secret.rarity .. "]"
            nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
            nameLabel.TextScaled = true
            nameLabel.TextXAlignment = Enum.TextXAlignment.Left
            nameLabel.Font = Enum.Font.GothamBold
            nameLabel.Parent = frame

            local countLabel = Instance.new("TextLabel")
            countLabel.Size = UDim2.new(0.2, 0, 1, 0)
            countLabel.Position = UDim2.new(0.75, 0, 0, 0)
            countLabel.BackgroundTransparency = 1
            countLabel.Text = "x" .. count
            countLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
            countLabel.TextScaled = true
            countLabel.Font = Enum.Font.GothamBold
            countLabel.Parent = frame
        end
    end

    if not hasSecrets then
        local noSecretsLabel = Instance.new("TextLabel")
        noSecretsLabel.Size = UDim2.new(1, 0, 0, 50)
        noSecretsLabel.BackgroundTransparency = 1
        noSecretsLabel.Text = "シークレットを持っていません"
        noSecretsLabel.TextColor3 = Color3.fromRGB(150, 150, 150)
        noSecretsLabel.TextScaled = true
        noSecretsLabel.Font = Enum.Font.Gotham
        noSecretsLabel.Parent = scroll
    end
end

-- 統計パネルを更新
local function UpdateStatsPanel(data)
    local statsContent = statsPanel:WaitForChild("StatsContent")

    local statsText = string.format([[
レベル: %d
経験値: %d
コイン: %d

総キル数: %d
総ダメージ: %d
ボス撃破数: %d
最高レベル: %d

トレード回数: %d
トレード価値: %d

デイリーログイン: %d日連続
]],
        data.Level,
        data.Exp,
        data.Coins,
        data.Stats.TotalKills,
        data.Stats.TotalDamageDealt,
        data.Stats.BossesDefeated,
        data.Stats.HighestLevel,
        data.TradeStats.TotalTrades,
        data.TradeStats.TotalValueTraded,
        data.DailyLoginStreak
    )

    statsContent.Text = statsText
end

-- パネル表示切り替え
local function TogglePanel(panel)
    local isVisible = panel.Visible

    -- 全パネルを閉じる
    evolutionPanel.Visible = false
    secretsPanel.Visible = false
    tradePanel.Visible = false
    statsPanel.Visible = false

    -- 選択したパネルを切り替え
    panel.Visible = not isVisible

    if panel.Visible and playerData then
        if panel == evolutionPanel then
            UpdateEvolutionPanel(playerData)
        elseif panel == secretsPanel then
            UpdateSecretsPanel(playerData)
        elseif panel == statsPanel then
            UpdateStatsPanel(playerData)
        end
    end
end

-- ボタンイベント
sideMenu:WaitForChild("EvolutionBtn").MouseButton1Click:Connect(function()
    TogglePanel(evolutionPanel)
end)

sideMenu:WaitForChild("SecretsBtn").MouseButton1Click:Connect(function()
    TogglePanel(secretsPanel)
end)

sideMenu:WaitForChild("TradeBtn").MouseButton1Click:Connect(function()
    TogglePanel(tradePanel)
end)

sideMenu:WaitForChild("StatsBtn").MouseButton1Click:Connect(function()
    TogglePanel(statsPanel)
end)

-- クローズボタン
evolutionPanel:WaitForChild("CloseBtn").MouseButton1Click:Connect(function()
    evolutionPanel.Visible = false
end)

secretsPanel:WaitForChild("CloseBtn").MouseButton1Click:Connect(function()
    secretsPanel.Visible = false
end)

tradePanel:WaitForChild("CloseBtn").MouseButton1Click:Connect(function()
    tradePanel.Visible = false
end)

statsPanel:WaitForChild("CloseBtn").MouseButton1Click:Connect(function()
    statsPanel.Visible = false
end)

-- イベントリスナー
Events.UpdateStats.OnClientEvent:Connect(function(data)
    UpdateUI(data)
end)

Events.LevelUp.OnClientEvent:Connect(function(newLevel)
    levelUpNotif:WaitForChild("LevelUpLabel").Text = "レベルアップ！\nLv. " .. newLevel
    levelUpNotif.Visible = true

    task.delay(3, function()
        levelUpNotif.Visible = false
    end)
end)

Events.EventStarted.OnClientEvent:Connect(function(eventData)
    eventLabel.Text = eventData.name .. "\n" .. eventData.description
    eventBanner.Visible = true

    -- タイマー更新
    local endTime = tick() + eventData.duration
    task.spawn(function()
        while eventBanner.Visible and tick() < endTime do
            local remaining = math.max(0, endTime - tick())
            local minutes = math.floor(remaining / 60)
            local seconds = math.floor(remaining % 60)
            eventTimerLabel.Text = string.format("残り時間: %02d:%02d", minutes, seconds)
            task.wait(1)
        end
    end)
end)

Events.EventEnded.OnClientEvent:Connect(function()
    eventBanner.Visible = false
end)

Events.SecretObtained.OnClientEvent:Connect(function(secret)
    -- シークレット獲得通知
    local notif = Instance.new("Frame")
    notif.Size = UDim2.new(0, 250, 0, 60)
    notif.Position = UDim2.new(0.5, -125, 0.7, 0)
    notif.BackgroundColor3 = GameConfig.RARITY_COLORS[secret.rarity]
    notif.Parent = mainUI

    Instance.new("UICorner", notif).CornerRadius = UDim.new(0, 10)

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "シークレット獲得！\n" .. secret.name
    label.TextColor3 = Color3.fromRGB(255, 255, 255)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = notif

    task.delay(3, function()
        notif:Destroy()
    end)
end)

Events.DamageDealt.OnClientEvent:Connect(function(data)
    -- ダメージ数表示
    local damageLabel = Instance.new("TextLabel")
    damageLabel.Size = UDim2.new(0, 100, 0, 30)
    damageLabel.Position = UDim2.new(0.5, math.random(-50, 50), 0.5, math.random(-50, 0))
    damageLabel.BackgroundTransparency = 1
    damageLabel.Text = "-" .. data.damage
    damageLabel.TextColor3 = Color3.fromRGB(255, 255, 0)
    damageLabel.TextStrokeTransparency = 0
    damageLabel.TextScaled = true
    damageLabel.Font = Enum.Font.GothamBold
    damageLabel.Parent = damageContainer

    -- アニメーション
    local tween = TweenService:Create(damageLabel, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Position = damageLabel.Position + UDim2.new(0, 0, -0.1, 0),
        TextTransparency = 1,
        TextStrokeTransparency = 1
    })
    tween:Play()

    task.delay(1, function()
        damageLabel:Destroy()
    end)
end)

Events.RewardObtained.OnClientEvent:Connect(function(reward)
    -- 報酬通知
    local notif = Instance.new("Frame")
    notif.Size = UDim2.new(0, 150, 0, 40)
    notif.Position = UDim2.new(0.5, -75, 0.8, 0)
    notif.BackgroundColor3 = Color3.fromRGB(50, 150, 50)
    notif.Parent = mainUI

    Instance.new("UICorner", notif).CornerRadius = UDim.new(0, 8)

    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = string.format("+%d EXP | +%d コイン", reward.exp, reward.coins)
    label.TextColor3 = Color3.fromRGB(255, 255, 255)
    label.TextScaled = true
    label.Font = Enum.Font.GothamBold
    label.Parent = notif

    -- アニメーション
    TweenService:Create(notif, TweenInfo.new(2), {
        Position = notif.Position + UDim2.new(0, 0, -0.05, 0),
        BackgroundTransparency = 1
    }):Play()

    TweenService:Create(label, TweenInfo.new(2), {
        TextTransparency = 1
    }):Play()

    task.delay(2, function()
        notif:Destroy()
    end)
end)

-- 初期データ取得
task.spawn(function()
    local data = Events.GetPlayerData:InvokeServer()
    if data then
        UpdateUI(data)
    end
end)

print("[MainUI] UI初期化完了！")
