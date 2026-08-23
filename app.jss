// --- Supabase Config ---
const SUPABASE_URL = "https://pbnxvxdbqtsawqsewddl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CdAmsR0a0AYj7CV8eAwBxQ_P-5L1W0c";

// Initialize client safely
let db = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

let activePlayerId = "P1";
let players = {
  P1: { id: "P1", name: "Player 1", role_title: "Head Barista", current_coins: 50, weekly_points: 30, active_outfit: "Barista Apron" },
  P2: { id: "P2", name: "Player 2", role_title: "Feline Enthusiast", current_coins: 40, weekly_points: 20, active_outfit: "Cozy Sweater" }
};

let chores = [
  { id: "C01", name: "Scoop Litter Boxes", category: "Daily Pet Care", points: 15, last_completed_by: null },
  { id: "C02", name: "Empty / Load Dishwasher", category: "Kitchen", points: 10, last_completed_by: null },
  { id: "C03", name: "Wipe Kitchen Counters", category: "Kitchen", points: 10, last_completed_by: null },
  { id: "C04", name: "Take Out Trash & Recycling", category: "Maintenance", points: 15, last_completed_by: null },
  { id: "C05", name: "Vacuum Living Room", category: "Deep Clean", points: 30, last_completed_by: null },
  { id: "C06", name: "Mop Hardwood Floors", category: "Deep Clean", points: 35, last_completed_by: null }
];

let catalog = [
  { id: "CAT01", name: "Calico Kitten", item_type: "Cat", cost: 50, sprite: "🐈", owned: true, owner_id: "P1", placed_in_cafe: true },
  { id: "CAT02", name: "Fluffy Tuxedo", item_type: "Cat", cost: 75, sprite: "🐈‍⬛", owned: false, owner_id: null, placed_in_cafe: false },
  { id: "CAT03", name: "Orange Tabby Troublemaker", item_type: "Cat", cost: 60, sprite: "🐱", owned: false, owner_id: null, placed_in_cafe: false },
  { id: "FUR01", name: "Sisal Scratching Post", item_type: "Toy", cost: 30, sprite: "🪵", owned: true, owner_id: "P2", placed_in_cafe: true },
  { id: "FUR02", name: "Deluxe Multi-Tier Cat Tree", item_type: "Furniture", cost: 120, sprite: "🏰", owned: false, owner_id: null, placed_in_cafe: false },
  { id: "W01", name: "Cat Ear Headband", item_type: "Wardrobe", cost: 25, sprite: "🎀", owned: false, owner_id: null, placed_in_cafe: false },
  { id: "W02", name: "Vintage Spectacles", item_type: "Wardrobe", cost: 30, sprite: "👓", owned: false, owner_id: null, placed_in_cafe: false }
];

async function initApp() {
  updateUI(); // Render immediately with initial data
  if (db) {
    await fetchData();
    setupRealtime();
    updateUI();
  }
}

async function fetchData() {
  try {
    const { data: pData } = await db.from('players').select('*');
    if (pData && pData.length > 0) {
      players = pData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
    }

    const { data: cData } = await db.from('chores').select('*');
    if (cData && cData.length > 0) chores = cData;

    const { data: catData } = await db.from('catalog').select('*');
    if (catData && catData.length > 0) catalog = catData;
  } catch (err) {
    console.log("Supabase fetch notice:", err);
  }
}

function setupRealtime() {
  try {
    db.channel('realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
        await fetchData();
        updateUI();
      })
      .subscribe();
  } catch (err) {
    console.log("Realtime setup notice:", err);
  }
}

function updateUI() {
  const activePlayer = players[activePlayerId] || { current_coins: 0, name: "Player" };
  document.getElementById("player-currency").textContent = `💰 ${activePlayer.current_coins || 0} Coins`;
  renderChores();
  renderCafe();
  renderShop();
  renderLeaderboard();
}

function switchPlayer(playerId) {
  activePlayerId = playerId;
  updateUI();
}

function showScreen(screenName) {
  const screens = ["quests", "cafe", "shop", "profile"];
  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle("hidden", s !== screenName);
  });

  const buttons = document.querySelectorAll(".nav-item");
  buttons.forEach((btn, idx) => {
    btn.classList.toggle("active", screens[idx] === screenName);
  });
}

async function completeChore(choreId) {
  const chore = chores.find(c => c.id === choreId);
  const player = players[activePlayerId];
  if (!chore || !player) return;

  player.current_coins = (player.current_coins || 0) + chore.points;
  player.weekly_points = (player.weekly_points || 0) + chore.points;
  player.lifetime_points = (player.lifetime_points || 0) + chore.points;
  chore.last_completed_by = player.name;

  updateUI();

  if (db) {
    try {
      await db.from('players').update({
        current_coins: player.current_coins,
        weekly_points: player.weekly_points,
        lifetime_points: player.lifetime_points
      }).eq('id', activePlayerId);

      await db.from('chores').update({
        last_completed_by: player.name
      }).eq('id', choreId);
    } catch (e) {
      console.error(e);
    }
  }

  alert(`✨ Great job! +${chore.points} coins awarded to ${player.name}!`);
}

async function buyItem(itemId) {
  const item = catalog.find(i => i.id === itemId);
  const player = players[activePlayerId];
  if (!item || item.owned || !player) return;

  if ((player.current_coins || 0) < item.cost) {
    alert("Not enough coins! Check off some chores first.");
    return;
  }

  player.current_coins -= item.cost;
  item.owned = true;
  item.owner_id = activePlayerId;
  item.placed_in_cafe = item.item_type !== 'Wardrobe';

  updateUI();

  if (db) {
    try {
      await db.from('players').update({
        current_coins: player.current_coins
      }).eq('id', activePlayerId);

      await db.from('catalog').update({
        owned: true,
        owner_id: activePlayerId,
        placed_in_cafe: item.placed_in_cafe
      }).eq('id', itemId);
    } catch (e) {
      console.error(e);
    }
  }

  alert(`🎉 Purchased ${item.name}!`);
}

function renderChores() {
  const container = document.getElementById("chore-list");
  if (!container) return;
  container.innerHTML = chores.map(chore => `
    <div class="card">
      <div>
        <div class="card-title">${chore.name}</div>
        <div class="card-sub">${chore.category} • 💰 ${chore.points} Coins ${chore.last_completed_by ? `(Last: ${chore.last_completed_by})` : ''}</div>
      </div>
      <button class="btn-action" onclick="completeChore('${chore.id}')">Done</button>
    </div>
  `).join("");
}

function renderCafe() {
  const container = document.getElementById("cafe-grid");
  if (!container) return;
  const placedItems = catalog.filter(i => i.placed_in_cafe && i.owned);

  if (placedItems.length === 0) {
    container.innerHTML = `<p style="grid-column: span 2; text-align: center; color: var(--text-muted);">The cafe is empty! Visit the shop to adopt your first cat.</p>`;
    return;
  }

  container.innerHTML = placedItems.map(item => `
    <div class="grid-item">
      <div class="sprite">${item.sprite}</div>
      <div class="card-title">${item.name}</div>
      <div class="card-sub">Added by ${players[item.owner_id]?.name || 'Both'}</div>
    </div>
  `).join("");
}

function renderShop() {
  const container = document.getElementById("shop-list");
  if (!container) return;
  const shopItems = catalog.filter(i => !i.owned);

  if (shopItems.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 20px;">Everything in the catalog has been unlocked!</p>`;
    return;
  }

  container.innerHTML = shopItems.map(item => `
    <div class="card">
      <div>
        <div class="card-title">${item.sprite} ${item.name}</div>
        <div class="card-sub">${item.item_type} • 💰 ${item.cost} Coins</div>
      </div>
      <button class="btn-action" onclick="buyItem('${item.id}')">Buy</button>
    </div>
  `).join("");
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-view");
  if (!container) return;
  const p1 = players.P1 || {};
  const p2 = players.P2 || {};

  container.innerHTML = `
    <div class="card" style="margin-bottom: 12px;">
      <div>
        <div class="card-title">👑 ${p1.name || 'Player 1'} (${p1.role_title || 'Barista'})</div>
        <div class="card-sub">Weekly Points: ${p1.weekly_points || 0} • Outfit: ${p1.active_outfit || 'Default'}</div>
      </div>
      <span style="font-weight:bold; color: var(--gold);">💰 ${p1.current_coins || 0}</span>
    </div>
    <div class="card">
      <div>
        <div class="card-title">⭐ ${p2.name || 'Player 2'} (${p2.role_title || 'Enthusiast'})</div>
        <div class="card-sub">Weekly Points: ${p2.weekly_points || 0} • Outfit: ${p2.active_outfit || 'Default'}</div>
      </div>
      <span style="font-weight:bold; color: var(--gold);">💰 ${p2.current_coins || 0}</span>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", initApp);
