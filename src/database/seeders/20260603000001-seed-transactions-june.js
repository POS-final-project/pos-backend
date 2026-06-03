"use strict";

/**
 * Supplemental seeder: transactions from 2026-05-24 to today (2026-06-03).
 * Reads live inventory state from DB so it continues where the main seeder left off.
 * UUID prefixes use 'e0/e1/e2/e3' namespaces — no collision with main seeder.
 */

const { faker } = require("@faker-js/faker");
const {
  getSyntheticSeedData,
  SALAMART_DALANGAN,
  SALAMART_CIKLI,
  SALAMART_PENGASIH,
  U_ADM_A, U_ADM_B, U_ADM_C,
  U_KSR_A1, U_KSR_A2, U_KSR_B1, U_KSR_C1,
  C_MNM, C_SNK, C_SMB, C_SSU, C_KBR,
  P, V,
} = require("./utils/synthetic-data");

// ─── Date range ───────────────────────────────────────────────────────────────

const DATE_START = new Date("2026-05-24T00:00:00.000Z");
const DATE_END   = new Date("2026-06-03T23:59:59.999Z");

// ─── ID generators (unique prefixes, no collision with main seeder) ───────────

const TX  = (n) => `e0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const TXI = (n) => `e1111111-1111-4111-8111-${String(n).padStart(12, "0")}`;
const SMV = (n) => `e2222222-2222-4222-8222-${String(n).padStart(12, "0")}`;
const SMR = (n) => `e3333333-3333-4333-8333-${String(n).padStart(12, "0")}`;

// ─── Shop / user maps ─────────────────────────────────────────────────────────

const SHOPS = [SALAMART_DALANGAN, SALAMART_CIKLI, SALAMART_PENGASIH];

const SHOP_USERS = {
  [SALAMART_DALANGAN]: { admin: U_ADM_A, cashiers: [U_KSR_A1, U_KSR_A2] },
  [SALAMART_CIKLI]:    { admin: U_ADM_B, cashiers: [U_KSR_B1] },
  [SALAMART_PENGASIH]: { admin: U_ADM_C, cashiers: [U_KSR_C1] },
};

const SHOP_VARIANTS = {
  [SALAMART_DALANGAN]: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
  [SALAMART_CIKLI]:    [1,3,5,6,7,8,9,12,13,15,17,18,20,21,23],
  [SALAMART_PENGASIH]: [1,3,5,7,8,9,12,13,15,17,18,20,21,23],
};

// ─── June 1 restock ───────────────────────────────────────────────────────────

const JUNE_RESTOCK = [
  {
    date: "2026-06-01",
    shopId: SALAMART_DALANGAN,
    userId: U_ADM_A,
    note: "Restock bulanan Juni — Salamart Dalangan",
    items: [
      { vi: 1,  qty: 320, cp: 2000   },
      { vi: 2,  qty: 160, cp: 4500   },
      { vi: 3,  qty: 230, cp: 2800   },
      { vi: 4,  qty: 90,  cp: 5800   },
      { vi: 5,  qty: 120, cp: 4500   },
      { vi: 6,  qty: 75,  cp: 6000   },
      { vi: 7,  qty: 420, cp: 2500   },
      { vi: 8,  qty: 320, cp: 2500   },
      { vi: 9,  qty: 90,  cp: 8000   },
      { vi: 10, qty: 75,  cp: 8000   },
      { vi: 11, qty: 75,  cp: 9500   },
      { vi: 12, qty: 110, cp: 6000   },
      { vi: 13, qty: 55,  cp: 62000  },
      { vi: 14, qty: 28,  cp: 120000 },
      { vi: 15, qty: 85,  cp: 17000  },
      { vi: 16, qty: 45,  cp: 33000  },
      { vi: 17, qty: 75,  cp: 14000  },
      { vi: 18, qty: 140, cp: 3200   },
      { vi: 19, qty: 120, cp: 3200   },
      { vi: 20, qty: 110, cp: 3500   },
      { vi: 21, qty: 55,  cp: 18000  },
      { vi: 22, qty: 30,  cp: 20000  },
      { vi: 23, qty: 16,  cp: 30000  },
    ],
  },
  {
    date: "2026-06-01",
    shopId: SALAMART_CIKLI,
    userId: U_ADM_B,
    note: "Restock bulanan Juni — Salamart Cikli",
    items: [
      { vi: 1,  qty: 200, cp: 2000  },
      { vi: 3,  qty: 150, cp: 2800  },
      { vi: 5,  qty: 85,  cp: 4500  },
      { vi: 6,  qty: 55,  cp: 6000  },
      { vi: 7,  qty: 280, cp: 2500  },
      { vi: 8,  qty: 220, cp: 2500  },
      { vi: 9,  qty: 75,  cp: 8000  },
      { vi: 12, qty: 75,  cp: 6000  },
      { vi: 13, qty: 40,  cp: 62000 },
      { vi: 15, qty: 55,  cp: 17000 },
      { vi: 17, qty: 65,  cp: 14000 },
      { vi: 18, qty: 90,  cp: 3200  },
      { vi: 20, qty: 75,  cp: 3500  },
      { vi: 21, qty: 40,  cp: 18000 },
      { vi: 23, qty: 9,   cp: 30000 },
    ],
  },
  {
    date: "2026-06-01",
    shopId: SALAMART_PENGASIH,
    userId: U_ADM_C,
    note: "Restock bulanan Juni — Salamart Pengasih",
    items: [
      { vi: 1,  qty: 120, cp: 2000  },
      { vi: 3,  qty: 85,  cp: 2800  },
      { vi: 5,  qty: 65,  cp: 4500  },
      { vi: 7,  qty: 150, cp: 2500  },
      { vi: 8,  qty: 120, cp: 2500  },
      { vi: 9,  qty: 45,  cp: 8000  },
      { vi: 12, qty: 50,  cp: 6000  },
      { vi: 13, qty: 25,  cp: 62000 },
      { vi: 15, qty: 40,  cp: 17000 },
      { vi: 17, qty: 40,  cp: 14000 },
      { vi: 18, qty: 60,  cp: 3200  },
      { vi: 20, qty: 45,  cp: 3500  },
      { vi: 21, qty: 28,  cp: 18000 },
      { vi: 23, qty: 5,   cp: 30000 },
    ],
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function makeDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function dateAt(dayKey, h, m) {
  return new Date(
    `${dayKey}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`,
  );
}

function randomInt(min, max) {
  return faker.number.int({ min, max });
}

function weightedChoice(items) {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let cursor = faker.number.float({ min: 0, max: total });
  for (const it of items) {
    cursor -= it.weight;
    if (cursor <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

function getCategoryMultiplier(variant, date, shopId) {
  const day     = date.getUTCDate();
  const weekday = date.getUTCDay();
  const shopKey = shopId === SALAMART_DALANGAN ? "A" : shopId === SALAMART_CIKLI ? "B" : "C";
  let m = variant.demand[shopKey];

  // June: no special month boost (normal month)
  if (weekday === 0 || weekday === 6) {
    if (variant.category_id === C_MNM || variant.category_id === C_SNK) m *= 1.25;
    else if (variant.category_id === C_SMB) m *= 1.15;
  }
  if (day <= 5 && variant.category_id === C_SMB) m *= 1.7;
  if (day >= 25 && variant.product_id === P(5)) m *= 5;
  if (variant.id === V(23)) m *= 0.06;
  return m;
}

function getDailyTransactionTarget(shopId, date) {
  const base = shopId === SALAMART_DALANGAN ? 33 : shopId === SALAMART_CIKLI ? 22 : 13;
  const weekendBoost = [0, 6].includes(date.getUTCDay())
    ? shopId === SALAMART_DALANGAN ? 1.18 : shopId === SALAMART_CIKLI ? 1.22 : 1.25
    : 1;
  const lateBoost = date.getUTCDate() >= 25 ? 1.1 : 1;
  return Math.max(1, Math.round(base * weekendBoost * lateBoost + randomInt(-2, 2)));
}

function getItemCount(shopId, date) {
  const wknd = [0, 6].includes(date.getUTCDay());
  if (shopId === SALAMART_DALANGAN) return randomInt(2, wknd ? 5 : 4);
  if (shopId === SALAMART_CIKLI)    return randomInt(2, wknd ? 4 : 3);
  return randomInt(1, wknd ? 3 : 2);
}

function pickUser(shopId) {
  const profile = SHOP_USERS[shopId];
  if (!profile.cashiers.length) return profile.admin;
  return faker.helpers.arrayElement([...profile.cashiers, profile.admin]);
}

// ─── Seeder ───────────────────────────────────────────────────────────────────

module.exports = {
  async up(queryInterface) {
    faker.seed(20260603);

    // Load variant metadata from cached synthetic data (no re-seeding, just metadata)
    const { variantRows } = getSyntheticSeedData();

    // Read current inventory state from DB
    const [invRows] = await queryInterface.sequelize.query(
      `SELECT shop_id, product_variant_id, stock, avg_cost_price FROM inventory`,
    );
    const state = new Map();
    for (const row of invRows) {
      state.set(`${row.shop_id}:${row.product_variant_id}`, {
        stock:   Number(row.stock),
        avgCost: Number(row.avg_cost_price),
      });
    }

    // Read customer IDs from DB
    const [custRows] = await queryInterface.sequelize.query(`SELECT id FROM customers`);
    const customerIds = custRows.map((r) => r.id);

    // Determine invoice counter start (safe offset above existing max)
    const [[{ max_seq }]] = await queryInterface.sequelize.query(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_no, '/', 4) AS INTEGER)), 0) AS max_seq
       FROM transactions
       WHERE invoice_no ~ '^INV/2026/[0-9]{2}/[0-9]+$'`,
    );
    let invoiceCounter = Number(max_seq) + 1;

    const transactions    = [];
    const transactionItems = [];
    const stockMovements  = [];
    const changedKeys     = new Set(); // track which inventory rows need UPDATE

    let txCounter     = 1;
    let txItemCounter = 1;
    let smCounter     = 1;
    let restockCounter = 1;

    const dayCursor = new Date(DATE_START);
    while (dayCursor <= DATE_END) {
      const dayKey = makeDayKey(dayCursor);

      // ── June 1 restock ────────────────────────────────────────────────────
      for (const plan of JUNE_RESTOCK.filter((p) => p.date === dayKey)) {
        const restockTime = dateAt(dayKey, 8, 0);
        for (const item of plan.items) {
          const variantId = V(item.vi);
          const key = `${plan.shopId}:${variantId}`;
          const cur = state.get(key);
          if (!cur) continue;

          const newStock = cur.stock + item.qty;
          const newAvgCost =
            cur.stock === 0
              ? item.cp
              : Math.round((cur.stock * cur.avgCost + item.qty * item.cp) / newStock);

          stockMovements.push({
            id: SMR(restockCounter++),
            shop_id: plan.shopId,
            user_id: plan.userId,
            product_variant_id: variantId,
            transaction_id: null,
            transfer_id: null,
            type: "restock",
            qty: item.qty,
            cost_price: item.cp,
            stock_before: cur.stock,
            stock_after: newStock,
            avg_cost_before: cur.avgCost,
            avg_cost_after: newAvgCost,
            note: plan.note,
            created_at: restockTime,
          });

          state.set(key, { stock: newStock, avgCost: newAvgCost });
          changedKeys.add(key);
        }
      }

      // ── Daily transactions ────────────────────────────────────────────────
      for (const shopId of SHOPS) {
        const targetCount   = getDailyTransactionTarget(shopId, dayCursor);
        const activeVariants = SHOP_VARIANTS[shopId]
          .map((vi) => variantRows.find((v) => v.id === V(vi)))
          .filter(Boolean);

        for (let i = 0; i < targetCount; i++) {
          // Build basket
          const basket = [];
          const picked = new Set();
          const targetItems = getItemCount(shopId, dayCursor);
          let attempts = 0;

          while (basket.length < targetItems && attempts < 30) {
            attempts++;
            const candidates = activeVariants
              .filter((v) => !picked.has(v.id))
              .map((v) => ({
                value:  v,
                weight: Math.max(getCategoryMultiplier(v, dayCursor, shopId), 0.01),
              }));
            if (!candidates.length) break;

            const variant = weightedChoice(candidates);
            const key     = `${shopId}:${variant.id}`;
            const cur     = state.get(key);

            if (!cur || cur.stock <= 0) { picked.add(variant.id); continue; }

            let qty = 1;
            if (variant.category_id === C_SMB) qty = randomInt(1, 4);
            else if (variant.category_id === C_SNK) qty = randomInt(1, 3);
            else if (variant.category_id === C_MNM) qty = randomInt(1, 4);
            else if (variant.category_id === C_SSU) qty = randomInt(1, 3);
            else if (variant.category_id === C_KBR) qty = randomInt(1, 2);

            if (dayCursor.getUTCDate() >= 25 && variant.product_id === P(5)) qty += randomInt(1, 2);
            if ([0, 6].includes(dayCursor.getUTCDay()) &&
                (variant.category_id === C_MNM || variant.category_id === C_SNK)) qty += 1;

            qty = Math.min(qty, cur.stock);
            if (qty < 1) { picked.add(variant.id); continue; }

            basket.push({ variant, qty, cur: { ...cur } });
            picked.add(variant.id);
          }

          if (!basket.length) continue;

          const txId     = TX(txCounter);
          const txTime   = dateAt(dayKey, randomInt(8, 20), randomInt(0, 59));
          const userId   = pickUser(shopId);
          const custId   = customerIds.length
            ? (randomInt(1, 100) <= 30 ? null : customerIds[(dayCursor.getUTCDate() + i) % customerIds.length])
            : null;
          const subtotal = basket.reduce((s, it) => s + it.variant.price * it.qty, 0);
          const payMethod = weightedChoice([
            { value: "cash", weight: 55 },
            { value: "qris", weight: 45 },
          ]);
          const monthStr = String(dayCursor.getUTCMonth() + 1).padStart(2, "0");

          transactions.push({
            id: txId,
            shop_id: shopId,
            user_id: userId,
            customer_id: custId,
            invoice_no: `INV/2026/${monthStr}/${String(invoiceCounter).padStart(6, "0")}`,
            status: "selesai",
            payment_method: payMethod,
            subtotal,
            paid_at: txTime,
            note:
              randomInt(1, 100) <= 55
                ? null
                : faker.helpers.arrayElement([
                    "Belanja harian",
                    "Belanja keluarga",
                    "Stok rumah tangga",
                  ]),
            created_at: new Date(txTime.getTime() - 2 * 60 * 1000),
            updated_at: txTime,
          });

          for (const item of basket) {
            const key = `${shopId}:${item.variant.id}`;
            const cur = state.get(key);

            transactionItems.push({
              id: TXI(txItemCounter),
              transaction_id: txId,
              product_variant_id: item.variant.id,
              qty: item.qty,
              price: item.variant.price,
              cost_price: item.variant.cost_price,
              subtotal: item.variant.price * item.qty,
            });

            stockMovements.push({
              id: SMV(smCounter++),
              shop_id: shopId,
              user_id: userId,
              product_variant_id: item.variant.id,
              transaction_id: txId,
              transfer_id: null,
              type: "sale",
              qty: -item.qty,
              cost_price: null,
              stock_before: cur.stock,
              stock_after: cur.stock - item.qty,
              avg_cost_before: cur.avgCost,
              avg_cost_after:  cur.avgCost,
              note: null,
              created_at: txTime,
            });

            state.set(key, { ...cur, stock: cur.stock - item.qty });
            changedKeys.add(key);
            txItemCounter++;
          }

          txCounter++;
          invoiceCounter++;
        }
      }

      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }

    // ── Insert rows ───────────────────────────────────────────────────────────
    if (transactions.length) {
      await queryInterface.bulkInsert("transactions",     transactions);
      await queryInterface.bulkInsert("transaction_items", transactionItems);
      await queryInterface.bulkInsert("stock_movements",  stockMovements);
    }

    // ── Update inventory for changed rows only ────────────────────────────────
    for (const key of changedKeys) {
      const [shopId, variantId] = key.split(":");
      const { stock, avgCost }  = state.get(key);
      await queryInterface.sequelize.query(
        `UPDATE inventory
            SET stock           = :stock,
                avg_cost_price  = :avgCost,
                updated_at      = NOW()
          WHERE shop_id              = :shopId
            AND product_variant_id   = :variantId`,
        { replacements: { stock, avgCost, shopId, variantId } },
      );
    }
  },

  async down(queryInterface) {
    // Cast UUID to text before LIKE — PostgreSQL requires this
    await queryInterface.sequelize.query(
      `DELETE FROM stock_movements
        WHERE id::text LIKE 'e2222222-2222-4222-8222-%'
           OR id::text LIKE 'e3333333-3333-4333-8333-%'`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM transaction_items WHERE id::text LIKE 'e1111111-1111-4111-8111-%'`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM transactions WHERE id::text LIKE 'e0000000-0000-4000-8000-%'`,
    );
  },
};
