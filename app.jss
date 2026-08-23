// --- Supabase Config (Replace with your actual keys from Supabase Settings -> API) ---
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
// const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Game State ---
let activePlayer = "P1";

const state = {
  players: {
    P1: { name: "Player 1", coins: 50, weekly: 30, title: "Head Barista", outfit: "Barista Apron" },
    P2: { name: "Player 2", coins: 40, weekly: 20, title: "Feline Enthusiast", outfit: "Cozy Sweater" }
  },
  chores: [
    { id: "C01", name: "Scoop Litter Boxes", category: "Daily Pet Care", points: 15 },
    { id: "C02", name: "Empty / Load Dishwasher", category: "Kitchen", points: 10 },
    { id: "C03", name: "Wipe Kitchen Counters", category: "Kitchen", points: 10 },
    { id: "C04", name: "Take Out Trash & Recycling", category: "Maintenance", points: 15 },
    { id: "C05", name: "Vacuum Living Room", category: "Deep Clean", points: 30 }
  ],
  cafeItems: [
    { id: "CAT01", name: "Calico Kitten", sprite: "🐈", type: "Cat", cost: 50, owned: true, owner: "P1" },
    { id: "CAT02", name: "Fluffy Tuxedo", sprite: "🐈‍⬛", type: "Cat", cost: 75, owned: false, owner: null },
    { id: "FUR01", name: "Sisal Scratch Post", sprite: "🪵", type: "Toy", cost: 30, owned: true, owner: "P2" },
    { id: "FUR02", name: "Deluxe Cat Tree", sprite: "🏰", type: "Furniture", cost: 100, owned: false, owner: null },
    { id: "W01", name: "Cat Ear Headband", sprite: "🎀", type: "Wardrobe", cost: 25, owned: false, owner: null }
  ]
};

// --- Core App Functions ---

function initApp() {
  updateUI();
}

function updateUI() {
  document.getElementById("player-currency").textContent = `💰 ${state.players[activePlayer].coins} Coins`;
  renderChores();
  renderCafe();
  renderShop();
  renderLeaderboard();
}

function switchPlayer(playerId) {
  activePlayer = playerId;
  updateUI();
}

function showScreen(screenName) {
  const screens = ["quests", "cafe", "shop", "profile"];
  screens.forEach(s => {
    document.getElementById(`screen-${s}`).classList.toggle("hidden", s !== screenName);
  });

  const buttons = document.querySelectorAll(".nav-item");
  buttons.forEach((btn, idx) => {
    btn.classList.toggle("active", screens[idx] === screenName);
  });
}

function completeChore(choreId) {
  const chore = state.chores.find(c => c.id === choreId);
  if (!chore) return;

  state.players[activePlayer].coins += chore.points;
  state.players[activePlayer].weekly += chore.points;

  alert(`✨ Great job! +${chore.points} coins awarded to ${state.players[activePlayer].name}!`);
  updateUI();
}

function buyItem(itemId) {
  const item = state.cafeItems.find(i => i.id === itemId);
  const player = state.players[activePlayer];

  if (!item || item.owned) return;

  if (player.coins < item.cost) {
    alert("Not enough coins! Check off some chores first.");
    return;
  }

  player.coins -= item.cost;
  item.owned = true;
  item.owner = activePlayer;

  alert(`🎉 Purchased ${item.name} for the Cafe!`);
  updateUI();
}

// --- Render Helpers ---

function renderChores() {
  const container = document.getElementById("chore-list");
  container.innerHTML = state.chores.map(chore => `
    <div class="card">
      <div>
        <div class="card-title">${chore.name}</div>
        <div class="card-sub">${chore.category} • 💰 ${chore.points} Coins</div>
      </div>
      <button class="btn-action" onclick="completeChore('${chore.id}')">Done</button>
    </div>
  `).join("");
}

function renderCafe() {
  const container = document.getElementById("cafe-grid");
  const placedItems = state.cafeItems.filter(i => i.owned);

  if (placedItems.length === 0) {
    container.innerHTML = `<p style="grid-column: span 2; text-align: center; color: var(--text-muted);">The cafe is empty! Visit the shop to adopt your first cat.</p>`;
    return;
  }

  container.innerHTML = placedItems.map(item => `
    <div class="grid-item">
      <div class="sprite">${item.sprite}</div>
      <div class="card-title">${item.name}</div>
      <div class="card-sub">Added by ${state.players[item.owner]?.name || 'Both'}</div>
    </div>
  `).join("");
}

function renderShop() {
  const container = document.getElementById("shop-list");
  const shopItems = state.cafeItems.filter(i => !i.owned);

  if (shopItems.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Everything in the catalog has been unlocked!</p>`;
    return;
  }

  container.innerHTML = shopItems.map(item => `
    <div class="card">
      <div>
        <div class="card-title">${item.sprite} ${item.name}</div>
        <div class="card-sub">${item.type} • 💰 ${item.cost} Coins</div>
      </div>
      <button class="btn-action" onclick="buyItem('${item.id}')">Buy</button>
    </div>
  `).join("");
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-view");
  const p1 = state.players.P1;
  const p2 = state.players.P2;

  container.innerHTML = `
    <div class="card" style="margin-bottom: 12px;">
      <div>
        <div class="card-title">👑 ${p1.name} (${p1.title})</div>
        <div class="card-sub">Weekly Points: ${p1.weekly} • Outfit: ${p1.outfit}</div>
      </div>
      <span style="font-weight:bold; color: var(--gold);">💰 ${p1.coins}</span>
    </div>
    <div class="card">
      <div>
        <div class="card-title">⭐ ${p2.name} (${p2.title})</div>
        <div class="card-sub">Weekly Points: ${p2.weekly} • Outfit: ${p2.outfit}</div>
      </div>
      <span style="font-weight:bold; color: var(--gold);">💰 ${p2.coins}</span>
    </div>
  `;
}

// Start
document.addEventListener("DOMContentLoaded", initApp);
