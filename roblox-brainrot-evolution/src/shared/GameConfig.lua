--[[
    ブレインロット進化ゲーム - ゲーム設定
    BrainRot Evolution Game - Game Configuration
]]

local GameConfig = {}

-- ゲーム基本設定
GameConfig.GAME_NAME = "ブレインロット進化"
GameConfig.VERSION = "1.0.0"

-- レベルシステム設定
GameConfig.MAX_LEVEL = 100
GameConfig.BASE_EXP_REQUIRED = 100
GameConfig.EXP_MULTIPLIER = 1.5

-- 進化形態（レアリティ順）
GameConfig.EVOLUTIONS = {
    {
        id = 1,
        name = "スキビディトイレ",
        nameEn = "Skibidi Toilet",
        rarity = "Common",
        damage = 10,
        health = 100,
        speed = 16,
        unlockLevel = 1,
        color = Color3.fromRGB(150, 150, 150)
    },
    {
        id = 2,
        name = "カメラマン",
        nameEn = "Cameraman",
        rarity = "Uncommon",
        damage = 25,
        health = 200,
        speed = 18,
        unlockLevel = 5,
        color = Color3.fromRGB(0, 200, 0)
    },
    {
        id = 3,
        name = "スピーカーマン",
        nameEn = "Speakerman",
        rarity = "Rare",
        damage = 50,
        health = 400,
        speed = 20,
        unlockLevel = 15,
        color = Color3.fromRGB(0, 100, 255)
    },
    {
        id = 4,
        name = "タイタンカメラマン",
        nameEn = "Titan Cameraman",
        rarity = "Epic",
        damage = 100,
        health = 800,
        speed = 22,
        unlockLevel = 30,
        color = Color3.fromRGB(200, 0, 200)
    },
    {
        id = 5,
        name = "タイタンスピーカーマン",
        nameEn = "Titan Speakerman",
        rarity = "Legendary",
        damage = 200,
        health = 1500,
        speed = 24,
        unlockLevel = 50,
        color = Color3.fromRGB(255, 200, 0)
    },
    {
        id = 6,
        name = "Gマン",
        nameEn = "G-Man",
        rarity = "Mythic",
        damage = 500,
        health = 3000,
        speed = 28,
        unlockLevel = 75,
        color = Color3.fromRGB(255, 50, 50)
    },
    {
        id = 7,
        name = "アストロトイレ",
        nameEn = "Astro Toilet",
        rarity = "Secret",
        damage = 1000,
        health = 5000,
        speed = 32,
        unlockLevel = 100,
        color = Color3.fromRGB(255, 255, 255)
    }
}

-- 敵の種類
GameConfig.ENEMIES = {
    {
        id = 1,
        name = "ミニスキビディ",
        nameEn = "Mini Skibidi",
        health = 50,
        damage = 5,
        expReward = 10,
        coinReward = 5,
        spawnWeight = 40
    },
    {
        id = 2,
        name = "ノーマルスキビディ",
        nameEn = "Normal Skibidi",
        health = 150,
        damage = 15,
        expReward = 30,
        coinReward = 15,
        spawnWeight = 30
    },
    {
        id = 3,
        name = "ラージスキビディ",
        nameEn = "Large Skibidi",
        health = 400,
        damage = 35,
        expReward = 80,
        coinReward = 40,
        spawnWeight = 15
    },
    {
        id = 4,
        name = "ボススキビディ",
        nameEn = "Boss Skibidi",
        health = 1000,
        damage = 75,
        expReward = 250,
        coinReward = 150,
        spawnWeight = 10
    },
    {
        id = 5,
        name = "タイタンスキビディ",
        nameEn = "Titan Skibidi",
        health = 5000,
        damage = 200,
        expReward = 1000,
        coinReward = 500,
        spawnWeight = 5
    }
}

-- シークレット設定
GameConfig.SECRETS = {
    {
        id = 1,
        name = "虹色の欠片",
        nameEn = "Rainbow Shard",
        rarity = "Rare",
        dropChance = 0.05,
        tradeValue = 100
    },
    {
        id = 2,
        name = "黄金の歯車",
        nameEn = "Golden Gear",
        rarity = "Epic",
        dropChance = 0.02,
        tradeValue = 500
    },
    {
        id = 3,
        name = "闇のクリスタル",
        nameEn = "Dark Crystal",
        rarity = "Legendary",
        dropChance = 0.005,
        tradeValue = 2000
    },
    {
        id = 4,
        name = "伝説の核",
        nameEn = "Legendary Core",
        rarity = "Mythic",
        dropChance = 0.001,
        tradeValue = 10000
    },
    {
        id = 5,
        name = "宇宙の種",
        nameEn = "Cosmic Seed",
        rarity = "Secret",
        dropChance = 0.0001,
        tradeValue = 100000
    }
}

-- イベント設定（1時間ごと）
GameConfig.HOURLY_EVENTS = {
    {
        id = 1,
        name = "ダブルEXPタイム",
        nameEn = "Double EXP Time",
        description = "経験値2倍！",
        duration = 600, -- 10分
        effect = {type = "exp_multiplier", value = 2}
    },
    {
        id = 2,
        name = "ゴールドラッシュ",
        nameEn = "Gold Rush",
        description = "コイン3倍！",
        duration = 600,
        effect = {type = "coin_multiplier", value = 3}
    },
    {
        id = 3,
        name = "ボスインベージョン",
        nameEn = "Boss Invasion",
        description = "ボスが大量出現！",
        duration = 300,
        effect = {type = "boss_spawn", value = 5}
    },
    {
        id = 4,
        name = "シークレットドロップ",
        nameEn = "Secret Drop",
        description = "シークレットドロップ率10倍！",
        duration = 600,
        effect = {type = "secret_multiplier", value = 10}
    },
    {
        id = 5,
        name = "メガイベント",
        nameEn = "Mega Event",
        description = "全てのボーナスが発動！",
        duration = 300,
        effect = {type = "mega", value = 2}
    }
}

-- レアリティカラー
GameConfig.RARITY_COLORS = {
    Common = Color3.fromRGB(150, 150, 150),
    Uncommon = Color3.fromRGB(0, 200, 0),
    Rare = Color3.fromRGB(0, 100, 255),
    Epic = Color3.fromRGB(200, 0, 200),
    Legendary = Color3.fromRGB(255, 200, 0),
    Mythic = Color3.fromRGB(255, 50, 50),
    Secret = Color3.fromRGB(255, 255, 255)
}

-- ヘルパー関数
function GameConfig.GetExpForLevel(level)
    return math.floor(GameConfig.BASE_EXP_REQUIRED * (GameConfig.EXP_MULTIPLIER ^ (level - 1)))
end

function GameConfig.GetEvolutionByLevel(level)
    local bestEvolution = GameConfig.EVOLUTIONS[1]
    for _, evolution in ipairs(GameConfig.EVOLUTIONS) do
        if level >= evolution.unlockLevel then
            bestEvolution = evolution
        end
    end
    return bestEvolution
end

function GameConfig.GetRandomEnemy()
    local totalWeight = 0
    for _, enemy in ipairs(GameConfig.ENEMIES) do
        totalWeight = totalWeight + enemy.spawnWeight
    end

    local random = math.random(1, totalWeight)
    local currentWeight = 0

    for _, enemy in ipairs(GameConfig.ENEMIES) do
        currentWeight = currentWeight + enemy.spawnWeight
        if random <= currentWeight then
            return enemy
        end
    end

    return GameConfig.ENEMIES[1]
end

function GameConfig.GetRandomEvent()
    return GameConfig.HOURLY_EVENTS[math.random(1, #GameConfig.HOURLY_EVENTS)]
end

return GameConfig
