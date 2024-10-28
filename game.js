<!DOCTYPE html>
<html>
<head><title>Game Logic</title></head>
<body>
<script>
// Oyun durumu
let gameState = {
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    gold: 0,
    diamonds: 0,
    energy: 100,
    maxEnergy: 100,
    plots: Array(25).fill().map(() => ({
        unlocked: false,
        crop: null,
        growthTime: 0,
        waterTime: 0
    })),
    inventory: {
        seed_wheat: 0,
        seed_carrot: 0,
        seed_potato: 0,
        wheat: 0,
        carrot: 0,
        potato: 0
    },
    upgrades: {
        farmSpeed: 1,
        energyMax: 1,
        plotUnlock: 0
    },
    quests: {},
    achievements: {},
    lastSave: Date.now(),
    settings: {
        sound: true
    }
};

// İlk 5 parsel açık başlar
for(let i = 0; i < 5; i++) {
    gameState.plots[i].unlocked = true;
}

// Ürün tipleri
const crops = {
    wheat: {
        name: "Buğday",
        growTime: 60000, // 1 dakika
        waterInterval: 30000, // 30 saniye
        yield: {min: 1, max: 3},
        xp: 10,
        sellPrice: 20
    },
    carrot: {
        name: "Havuç",
        growTime: 120000, // 2 dakika
        waterInterval: 45000, // 45 saniye
        yield: {min: 2, max: 4},
        xp: 20,
        sellPrice: 35
    },
    potato: {
        name: "Patates",
        growTime: 180000, // 3 dakika
        waterInterval: 60000, // 1 dakika
        yield: {min: 3, max: 6},
        xp: 30,
        sellPrice: 50
    }
};

// Görevler
const questTemplates = [
    {
        id: 'harvest_wheat_10',
        name: 'Başlangıç Çiftçisi',
        description: 'Topla 10 buğday',
        target: 10,
        type: 'harvest',
        crop: 'wheat',
        reward: {gold: 100, xp: 50}
    },
    // Diğer görevler buraya eklenecek
];

// Başarımlar
const achievementTemplates = [
    {
        id: 'first_harvest',
        name: 'İlk Hasat',
        description: 'İlk ürününü topla',
        condition: (state) => state.stats.totalHarvest > 0,
        reward: {diamonds: 1}
    },
    // Diğer başarımlar buraya eklenecek
];

// UI Güncelleme Fonksiyonları
function updateUI() {
    // Ana istatistikler
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('diamonds').textContent = gameState.diamonds;
    document.getElementById('energy').textContent = gameState.energy;
    
    // XP bar
    const xpPercentage = (gameState.xp / gameState.nextLevelXp) * 100;
    document.getElementById('xpProgress').style.width = `${xpPercentage}%`;
    
    //
