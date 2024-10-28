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
    
    // UI Güncelleme Fonksiyonları (devamı)
function updateUI() {
    // Ana istatistikler
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('diamonds').textContent = gameState.diamonds;
    document.getElementById('energy').textContent = gameState.energy;
    
    // XP bar
    const xpPercentage = (gameState.xp / gameState.nextLevelXp) * 100;
    document.getElementById('xpProgress').style.width = `${xpPercentage}%`;
    
    // Enerji bar
    const energyPercentage = (gameState.energy / gameState.maxEnergy) * 100;
    document.getElementById('energyProgress').style.width = `${energyPercentage}%`;
    
    // Çiftlik alanını güncelle
    updateFarmGrid();
    
    // Envanter güncelleme
    updateInventory();
    
    // Görevleri güncelle
    updateQuests();
    
    // Başarımları güncelle
    updateAchievements();
}

function updateFarmGrid() {
    const farmGrid = document.getElementById('farmGrid');
    farmGrid.innerHTML = '';
    
    gameState.plots.forEach((plot, index) => {
        const plotElement = document.createElement('div');
        plotElement.className = `farm-plot ${plot.unlocked ? '' : 'locked'}`;
        
        if (plot.unlocked) {
            if (plot.crop) {
                const progress = (Date.now() - plot.growthTime) / crops[plot.crop].growTime * 100;
                plotElement.innerHTML = `
                    <div class="crop-info">
                        <div>${crops[plot.crop].name}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                `;
                plotElement.onclick = () => harvestCrop(index);
            } else {
                plotElement.innerHTML = '<div>Boş Arazi</div>';
                plotElement.onclick = () => showPlantingModal(index);
            }
        } else {
            plotElement.innerHTML = '<div>Kilitli</div>';
            plotElement.onclick = () => unlockPlot(index);
        }
        
        farmGrid.appendChild(plotElement);
    });
}

function updateInventory() {
    const inventoryGrid = document.getElementById('inventoryGrid');
    inventoryGrid.innerHTML = '';
    
    Object.entries(gameState.inventory).forEach(([item, amount]) => {
        if (amount > 0) {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <h3>${getItemName(item)}</h3>
                <p>Miktar: ${amount}</p>
                ${item.startsWith('seed_') ? 
                    `<button class="button button-primary" onclick="plantCrop('${item.replace('seed_', '')}')">Ek</button>` :
                    `<button class="button button-secondary" onclick="sellItem('${item}')">Sat</button>`}
            `;
            inventoryGrid.appendChild(itemElement);
        }
    });
}

// Oyun Mantığı Fonksiyonları
function plantCrop(plotIndex, cropType) {
    if (gameState.energy < 10) {
        showNotification('Yeterli enerji yok!');
        return;
    }
    
    const seedType = `seed_${cropType}`;
    if (gameState.inventory[seedType] <= 0) {
        showNotification('Yeterli tohum yok!');
        return;
    }
    
    gameState.inventory[seedType]--;
    gameState.energy -= 10;
    gameState.plots[plotIndex].crop = cropType;
    gameState.plots[plotIndex].growthTime = Date.now();
    gameState.plots[plotIndex].waterTime = Date.now();
    
    updateUI();
    saveGame();
}

function harvestCrop(plotIndex) {
    const plot = gameState.plots[plotIndex];
    if (!plot.crop) return;
    
    const cropData = crops[plot.crop];
    const growthProgress = Date.now() - plot.growthTime;
    
    if (growthProgress < cropData.growTime) {
        showNotification('Ürün henüz hazır değil!');
        return;
    }
    
    if (gameState.energy < 5) {
        showNotification('Yeterli enerji yok!');
        return;
    }
    
    // Hasat miktarını hesapla
    const yield = Math.floor(Math.random() * (cropData.yield.max - cropData.yield.min + 1)) + cropData.yield.min;
    
    gameState.inventory[plot.crop] += yield;
    gameState.energy -= 5;
    gameState.xp += cropData.xp;
    
    // Level kontrolü
    checkLevelUp();
    
    // Parseli temizle
    plot.crop = null;
    plot.growthTime = 0;
    plot.waterTime = 0;
    
    showNotification(`${cropData.name} hasadı: ${yield} adet`);
    updateUI();
    saveGame();
}

function sellItem(itemType) {
    if (gameState.inventory[itemType] <= 0) return;
    
    const sellPrice = crops[itemType].sellPrice;
    gameState.gold += sellPrice;
    gameState.inventory[itemType]--;
    
    showNotification(`${getItemName(itemType)} satıldı: +${sellPrice} altın`);
    updateUI();
    saveGame();
}

function unlockPlot(index) {
    const unlockCost = 100 * (gameState.upgrades.plotUnlock + 1);
    
    if (gameState.gold < unlockCost) {
        showNotification('Yeterli altın yok!');
        return;
    }
    
    gameState.gold -= unlockCost;
    gameState.plots[index].unlocked = true;
    gameState.upgrades.plotUnlock++;
    
    showNotification('Yeni arazi açıldı!');
    updateUI();
    saveGame();
}

// Yardımcı Fonksiyonlar
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getItemName(item) {
    if (item.startsWith('seed_')) {
        return crops[item.replace('seed_', '')].name + ' Tohumu';
    }
    return crops[item].name;
}

function checkLevelUp() {
    if (gameState.xp >= gameState.nextLevelXp) {
        gameState.level++;
        gameState.xp -= gameState.nextLevelXp;
        gameState.nextLevelXp = Math.floor(gameState.nextLevelXp * 1.5);
        showNotification(`Seviye atladın! Yeni seviye: ${gameState.level}`);
    }
}

// Kayıt İşlemleri
function saveGame() {
    localStorage.setItem('megaFarmSave', JSON.stringify(gameState));
    gameState.lastSave = Date.now();
}

function loadGame() {
    const savedGame = localStorage.getItem('megaFarmSave');
    if (savedGame) {
        gameState = JSON.parse(savedGame);
        updateUI();
    }
}

function resetGame() {
    if (confirm('Oyunu sıfırlamak istediğinize emin misiniz? Tüm ilerlemeniz silinecek!')) {
        localStorage.removeItem('megaFarmSave');
        location.reload();
    }
}

// Sekme İşlemleri
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-section`).classList.add('active');
    });
});

// Modal İşlemleri
function showPlantingModal(plotIndex) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <h2>Ne ekmek istersin?</h2>
        <div class="shop-grid">
            ${Object.keys(crops).map(crop => `
                <div class="shop-item" onclick="plantCrop(${plotIndex}, '${crop}')">
                    <h3>${crops[crop].name}</h3>
                    <p>Büyüme Süresi: ${crops[crop].growTime / 1000}s</p>
                    <p>Tohum: ${gameState.inventory['seed_' + crop]}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Otomatik Kayıt ve Yüklenme
window.addEventListener('load', () => {
    loadGame();
    setInterval(saveGame, 60000); // Her dakika otomatik kayıt
});

// Enerji Yenilenmesi
setInterval(() => {
    if (gameState.energy < gameState.maxEnergy) {
        gameState.energy = Math.min(gameState.energy + 1, gameState.maxEnergy);
        updateUI();
    }
}, 30000); // Her 30 saniyede 1 enerji yenilenir
