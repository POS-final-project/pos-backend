"use strict";

const { faker } = require("@faker-js/faker");

const DATE_START = new Date("2026-03-01T00:00:00.000Z");
const DATE_END = new Date("2026-05-23T23:59:59.999Z");
const INITIAL_RESTOCK_DATE = new Date("2026-03-01T07:00:00.000Z");

const SALAMART_DALANGAN = "11111111-1111-4111-8111-111111111001";
const SALAMART_CIKLI = "11111111-1111-4111-8111-111111111002";
const SALAMART_PENGASIH = "11111111-1111-4111-8111-111111111003";

const U_SUPER = "22222222-2222-4222-8222-222222222001";
const U_ADM_A = "22222222-2222-4222-8222-222222222002";
const U_ADM_B = "22222222-2222-4222-8222-222222222003";
const U_ADM_C = "22222222-2222-4222-8222-222222222004";
const U_KSR_A1 = "22222222-2222-4222-8222-222222222005";
const U_KSR_A2 = "22222222-2222-4222-8222-222222222006";
const U_KSR_B1 = "22222222-2222-4222-8222-222222222007";
const U_KSR_C1 = "22222222-2222-4222-8222-222222222008";

const C_MNM = "33333333-3333-4333-8333-333333333001";
const C_SNK = "33333333-3333-4333-8333-333333333002";
const C_SMB = "33333333-3333-4333-8333-333333333003";
const C_SSU = "33333333-3333-4333-8333-333333333004";
const C_KBR = "33333333-3333-4333-8333-333333333005";

const P = (n) =>
  `55555555-5555-4555-8555-5555555500${String(n).padStart(2, "0")}`;
const V = (n) =>
  `66666666-6666-4666-8666-6666666600${String(n).padStart(2, "0")}`;
const I = (prefix, n) => `${prefix}${String(n).padStart(12, "0")}`;
const T = (n) => `88888888-8888-4888-8888-${String(n).padStart(12, "0")}`;
const TI = (n) => `99999999-9999-4999-8999-${String(n).padStart(12, "0")}`;
const TRF = (n) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
const TRFI = (n) => `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;
const SM = (typeDigit, n) =>
  `cccccccc-cccc-4ccc-8ccc-${typeDigit}${String(n).padStart(11, "0")}`;
const R = (n) => `dddddddd-dddd-4ddd-8ddd-${String(n).padStart(12, "0")}`;
const RI = (n) => `eeeeeeee-eeee-4eee-8eee-${String(n).padStart(12, "0")}`;

const shopUsers = {
  [SALAMART_DALANGAN]: { admin: U_ADM_A, cashiers: [U_KSR_A1, U_KSR_A2] },
  [SALAMART_CIKLI]: { admin: U_ADM_B, cashiers: [U_KSR_B1] },
  [SALAMART_PENGASIH]: { admin: U_ADM_C, cashiers: [U_KSR_C1] },
};

const categoryRows = [
  { id: C_MNM, name: "Minuman" },
  { id: C_SNK, name: "Makanan Ringan" },
  { id: C_SMB, name: "Sembako" },
  { id: C_SSU, name: "Produk Susu" },
  { id: C_KBR, name: "Kebersihan Diri" },
];

const productRows = [
  {
    id: P(1),
    category_id: C_MNM,
    name: "Aqua Botol",
    description: "Air mineral botol untuk konsumsi harian",
  },
  {
    id: P(2),
    category_id: C_MNM,
    name: "Teh Botol Sosro",
    description: "Teh manis botol siap minum",
  },
  {
    id: P(3),
    category_id: C_MNM,
    name: "Coca-Cola",
    description: "Minuman berkarbonasi rasa cola",
  },
  {
    id: P(4),
    category_id: C_MNM,
    name: "Pocari Sweat",
    description: "Minuman isotonik pengganti ion tubuh",
  },
  {
    id: P(5),
    category_id: C_SNK,
    name: "Indomie",
    description: "Mi instan berbagai rasa",
  },
  {
    id: P(6),
    category_id: C_SNK,
    name: "Chitato",
    description: "Keripik kentang rasa gurih",
  },
  {
    id: P(7),
    category_id: C_SNK,
    name: "Oreo",
    description: "Biskuit sandwich krim coklat",
  },
  {
    id: P(8),
    category_id: C_SNK,
    name: "Biskuat",
    description: "Biskuit bergizi untuk keluarga",
  },
  {
    id: P(9),
    category_id: C_SMB,
    name: "Beras Premium",
    description: "Beras putih premium",
  },
  {
    id: P(10),
    category_id: C_SMB,
    name: "Minyak Goreng Tropical",
    description: "Minyak goreng sawit",
  },
  {
    id: P(11),
    category_id: C_SMB,
    name: "Gula Pasir Gulaku",
    description: "Gula pasir premium",
  },
  {
    id: P(12),
    category_id: C_SSU,
    name: "Indomilk UHT",
    description: "Susu UHT siap minum",
  },
  {
    id: P(13),
    category_id: C_SSU,
    name: "Frisian Flag",
    description: "Susu UHT berbagai rasa",
  },
  {
    id: P(14),
    category_id: C_KBR,
    name: "Lifebuoy Sabun Cair",
    description: "Sabun cair antibakteri",
  },
  {
    id: P(15),
    category_id: C_KBR,
    name: "Pantene Shampoo",
    description: "Sampo perawatan rambut",
  },
];

const variantRows = [
  // Aqua
  {
    id: V(1),
    product_id: P(1),
    name: "600ml",
    sku: "AQU-600",
    barcode: "8991101000016",
    image_url: "/seed-images/AQU-600.jpg",
    price: 3500,
    cost_price: 2000,
    category_id: C_MNM,
    demand: { A: 1.5, B: 1.4, C: 1.35 },
    initial_stock: { A: 680, B: 460, C: 290 },
    low_stock_threshold: { A: 70, B: 50, C: 35 },
  },
  {
    id: V(2),
    product_id: P(1),
    name: "1500ml",
    sku: "AQU-1500",
    barcode: "8991101000023",
    image_url: "/seed-images/AQU_1500.webp",
    price: 7000,
    cost_price: 4500,
    category_id: C_MNM,
    demand: { A: 1.1, B: 1.0, C: 0.85 },
    initial_stock: { A: 350, B: 220, C: 0 },
    low_stock_threshold: { A: 40, B: 30, C: 0 },
  },
  // Teh Botol Sosro
  {
    id: V(3),
    product_id: P(2),
    name: "450ml",
    sku: "TBS-450",
    barcode: "8991102000014",
    image_url: "/seed-images/TBS-450.jpg",
    price: 4000,
    cost_price: 2800,
    category_id: C_MNM,
    demand: { A: 1.4, B: 1.2, C: 1.0 },
    initial_stock: { A: 520, B: 330, C: 200 },
    low_stock_threshold: { A: 50, B: 35, C: 25 },
  },
  {
    id: V(4),
    product_id: P(2),
    name: "1 Liter",
    sku: "TBS-1000",
    barcode: "8991102000021",
    image_url: "/seed-images/TBS-1000.jpg",
    price: 8500,
    cost_price: 5800,
    category_id: C_MNM,
    demand: { A: 0.95, B: 0.8, C: 0.6 },
    initial_stock: { A: 240, B: 140, C: 0 },
    low_stock_threshold: { A: 20, B: 15, C: 0 },
  },
  // Coca-Cola
  {
    id: V(5),
    product_id: P(3),
    name: "390ml",
    sku: "CCL-390",
    barcode: "8991103000013",
    image_url: "/seed-images/CCL-390.jpg",
    price: 7000,
    cost_price: 4500,
    category_id: C_MNM,
    demand: { A: 1.0, B: 0.9, C: 0.75 },
    initial_stock: { A: 290, B: 200, C: 160 },
    low_stock_threshold: { A: 35, B: 25, C: 20 },
  },
  // Pocari Sweat
  {
    id: V(6),
    product_id: P(4),
    name: "500ml",
    sku: "PCS-500",
    barcode: "8991104000012",
    image_url: "/seed-images/PCS-500.jpg",
    price: 9000,
    cost_price: 6000,
    category_id: C_MNM,
    demand: { A: 0.9, B: 0.8, C: 0.7 },
    initial_stock: { A: 200, B: 140, C: 100 },
    low_stock_threshold: { A: 20, B: 15, C: 10 },
  },
  // Indomie
  {
    id: V(7),
    product_id: P(5),
    name: "Goreng",
    sku: "IDM-GRG",
    barcode: "8991105000011",
    image_url: "/seed-images/IDM-GRG.jpg",
    price: 3500,
    cost_price: 2500,
    category_id: C_SNK,
    demand: { A: 2.2, B: 2.0, C: 1.8 },
    initial_stock: { A: 980, B: 680, C: 360 },
    low_stock_threshold: { A: 120, B: 80, C: 45 },
  },
  {
    id: V(8),
    product_id: P(5),
    name: "Kuah Ayam Bawang",
    sku: "IDM-KAB",
    barcode: "8991105000028",
    image_url: "/seed-images/IDM-KAB.jpg",
    price: 3500,
    cost_price: 2500,
    category_id: C_SNK,
    demand: { A: 1.9, B: 1.7, C: 1.45 },
    initial_stock: { A: 830, B: 530, C: 290 },
    low_stock_threshold: { A: 100, B: 70, C: 40 },
  },
  // Chitato
  {
    id: V(9),
    product_id: P(6),
    name: "Sapi Panggang 68g",
    sku: "CHT-SP68",
    barcode: "8991106000010",
    image_url: "/seed-images/CHT-SP68.webp",
    price: 12000,
    cost_price: 8000,
    category_id: C_SNK,
    demand: { A: 0.85, B: 0.8, C: 0.65 },
    initial_stock: { A: 240, B: 180, C: 110 },
    low_stock_threshold: { A: 25, B: 20, C: 15 },
  },
  {
    id: V(10),
    product_id: P(6),
    name: "Jagung Bakar 68g",
    sku: "CHT-JB68",
    barcode: "8991106000027",
    image_url: "/seed-images/CHT-JB68.jpg",
    price: 12000,
    cost_price: 8000,
    category_id: C_SNK,
    demand: { A: 0.8, B: 0.7, C: 0.55 },
    initial_stock: { A: 200, B: 140, C: 0 },
    low_stock_threshold: { A: 20, B: 15, C: 0 },
  },
  // Oreo
  {
    id: V(11),
    product_id: P(7),
    name: "Original 133g",
    sku: "ORO-133",
    barcode: "8991107000016",
    image_url: "/seed-images/ORO-133.webp",
    price: 14000,
    cost_price: 9500,
    category_id: C_SNK,
    demand: { A: 0.75, B: 0.65, C: 0.5 },
    initial_stock: { A: 200, B: 140, C: 90 },
    low_stock_threshold: { A: 25, B: 18, C: 12 },
  },
  // Biskuat
  {
    id: V(12),
    product_id: P(8),
    name: "Susu 100g",
    sku: "BSK-S100",
    barcode: "8991108000015",
    image_url: "/seed-images/BSK-S100.png",
    price: 8500,
    cost_price: 6000,
    category_id: C_SNK,
    demand: { A: 0.9, B: 0.8, C: 0.65 },
    initial_stock: { A: 260, B: 180, C: 110 },
    low_stock_threshold: { A: 30, B: 22, C: 15 },
  },
  // Beras Premium
  {
    id: V(13),
    product_id: P(9),
    name: "5kg",
    sku: "BRS-5KG",
    barcode: "8991109000014",
    image_url: "/seed-images/BRS-5KG.jpg",
    price: 78000,
    cost_price: 62000,
    category_id: C_SMB,
    demand: { A: 0.55, B: 0.45, C: 0.35 },
    initial_stock: { A: 130, B: 90, C: 60 },
    low_stock_threshold: { A: 15, B: 12, C: 8 },
  },
  {
    id: V(14),
    product_id: P(9),
    name: "10kg",
    sku: "BRS-10KG",
    barcode: "8991109000021",
    image_url: "/seed-images/BRS-10KG.webp",
    price: 150000,
    cost_price: 120000,
    category_id: C_SMB,
    demand: { A: 0.3, B: 0.25, C: 0.2 },
    initial_stock: { A: 70, B: 50, C: 30 },
    low_stock_threshold: { A: 10, B: 8, C: 5 },
  },
  // Minyak Goreng
  {
    id: V(15),
    product_id: P(10),
    name: "1 Liter",
    sku: "MGT-1L",
    barcode: "8991110000013",
    image_url: "/seed-images/MGT-1L.webp",
    price: 21000,
    cost_price: 17000,
    category_id: C_SMB,
    demand: { A: 0.65, B: 0.55, C: 0.45 },
    initial_stock: { A: 180, B: 130, C: 90 },
    low_stock_threshold: { A: 20, B: 15, C: 10 },
  },
  {
    id: V(16),
    product_id: P(10),
    name: "2 Liter",
    sku: "MGT-2L",
    barcode: "8991110000020",
    image_url: "/seed-images/MGT-2L.webp",
    price: 40000,
    cost_price: 33000,
    category_id: C_SMB,
    demand: { A: 0.45, B: 0.38, C: 0.3 },
    initial_stock: { A: 120, B: 80, C: 60 },
    low_stock_threshold: { A: 15, B: 10, C: 8 },
  },
  // Gula
  {
    id: V(17),
    product_id: P(11),
    name: "1kg",
    sku: "GUL-1KG",
    barcode: "8991111000012",
    image_url: "/seed-images/GUL-1KG.jpg",
    price: 17500,
    cost_price: 14000,
    category_id: C_SMB,
    demand: { A: 0.6, B: 0.5, C: 0.4 },
    initial_stock: { A: 200, B: 150, C: 100 },
    low_stock_threshold: { A: 25, B: 18, C: 12 },
  },
  // Indomilk UHT
  {
    id: V(18),
    product_id: P(12),
    name: "Full Cream 200ml",
    sku: "IML-FC200",
    barcode: "8991112000011",
    image_url: "/seed-images/IML-FC200.webp",
    price: 4500,
    cost_price: 3200,
    category_id: C_SSU,
    demand: { A: 0.9, B: 0.8, C: 0.7 },
    initial_stock: { A: 320, B: 220, C: 140 },
    low_stock_threshold: { A: 35, B: 25, C: 18 },
  },
  // Frisian Flag
  {
    id: V(19),
    product_id: P(13),
    name: "Putih 200ml",
    sku: "FFF-PT200",
    barcode: "8991113000010",
    image_url: "/seed-images/FFF-PT200.png",
    price: 4500,
    cost_price: 3200,
    category_id: C_SSU,
    demand: { A: 0.85, B: 0.78, C: 0.68 },
    initial_stock: { A: 280, B: 190, C: 120 },
    low_stock_threshold: { A: 30, B: 22, C: 15 },
  },
  {
    id: V(20),
    product_id: P(13),
    name: "Coklat 200ml",
    sku: "FFF-CK200",
    barcode: "8991113000027",
    image_url: "/seed-images/FF-CK200.webp",
    price: 5000,
    cost_price: 3500,
    category_id: C_SSU,
    demand: { A: 0.8, B: 0.75, C: 0.65 },
    initial_stock: { A: 260, B: 175, C: 110 },
    low_stock_threshold: { A: 25, B: 20, C: 10 },
  },
  // Lifebuoy
  {
    id: V(21),
    product_id: P(14),
    name: "Sabun Cair Merah 450ml",
    sku: "LFB-450",
    barcode: "8991114000016",
    image_url: "/seed-images/LFB-450.jpg",
    price: 25000,
    cost_price: 18000,
    category_id: C_KBR,
    demand: { A: 0.55, B: 0.5, C: 0.45 },
    initial_stock: { A: 140, B: 100, C: 70 },
    low_stock_threshold: { A: 15, B: 10, C: 8 },
  },
  // Pantene
  {
    id: V(22),
    product_id: P(15),
    name: "Smooth & Shiny 170ml",
    sku: "PTN-SS170",
    barcode: "8991115000015",
    image_url: "/seed-images/PTN-SS170.webp",
    price: 28500,
    cost_price: 20000,
    category_id: C_KBR,
    demand: { A: 0.22, B: 0.18, C: 0.15 },
    initial_stock: { A: 80, B: 50, C: 0 },
    low_stock_threshold: { A: 10, B: 5, C: 0 },
  },
  {
    id: V(23),
    product_id: P(15),
    name: "Damage Care 290ml",
    sku: "PTN-DC290",
    barcode: "8991115000022",
    image_url: "/seed-images/PTN-DC290.webp",
    price: 42000,
    cost_price: 30000,
    category_id: C_KBR,
    demand: { A: 0.06, B: 0.05, C: 0.04 },
    initial_stock: { A: 40, B: 25, C: 15 },
    low_stock_threshold: { A: 5, B: 4, C: 3 },
  },
];

const shopInventoryVariants = {
  [SALAMART_DALANGAN]: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23,
  ],
  [SALAMART_CIKLI]: [1, 3, 5, 6, 7, 8, 9, 12, 13, 15, 17, 18, 20, 21, 23],
  [SALAMART_PENGASIH]: [1, 3, 5, 7, 8, 9, 12, 13, 15, 17, 18, 20, 21, 23],
};

const loyalProfiles = [
  {
    customerId: "44444444-4444-4444-8444-444444440001",
    shopId: SALAMART_DALANGAN,
    interval: [3, 5],
    nextVisit: "2026-03-02",
  },
  {
    customerId: "44444444-4444-4444-8444-444444440002",
    shopId: SALAMART_DALANGAN,
    interval: [3, 5],
    nextVisit: "2026-03-04",
  },
  {
    customerId: "44444444-4444-4444-8444-444444440003",
    shopId: SALAMART_CIKLI,
    interval: [3, 5],
    nextVisit: "2026-03-03",
  },
  {
    customerId: "44444444-4444-4444-8444-444444440004",
    shopId: SALAMART_CIKLI,
    interval: [3, 5],
    nextVisit: "2026-03-01",
  },
  {
    customerId: "44444444-4444-4444-8444-444444440005",
    shopId: SALAMART_PENGASIH,
    interval: [3, 5],
    nextVisit: "2026-03-05",
  },
];

const transferPlans = [
  {
    date: "2026-03-10",
    fromShopId: SALAMART_DALANGAN,
    toShopId: SALAMART_PENGASIH,
    requestedBy: U_ADM_A,
    confirmedBy: U_ADM_C,
    status: "approved",
    note: "Transfer darurat stok minuman ke Pengasih awal bulan",
    items: [
      { variantId: V(1), qty: 80 },
      { variantId: V(7), qty: 100 },
    ],
  },
  {
    date: "2026-03-20",
    fromShopId: SALAMART_CIKLI,
    toShopId: SALAMART_PENGASIH,
    requestedBy: U_ADM_B,
    confirmedBy: null,
    status: "pending",
    note: "Request transfer minuman isotonik ke Pengasih",
    items: [
      { variantId: V(6), qty: 25 },
      { variantId: V(5), qty: 20 },
    ],
  },
  {
    date: "2026-03-28",
    fromShopId: SALAMART_DALANGAN,
    toShopId: SALAMART_CIKLI,
    requestedBy: U_ADM_A,
    confirmedBy: U_ADM_B,
    status: "approved",
    note: "Rebalancing stok sembako ke Cikli akhir Maret",
    items: [
      { variantId: V(13), qty: 30 },
      { variantId: V(15), qty: 50 },
      { variantId: V(17), qty: 40 },
    ],
  },
  {
    date: "2026-04-05",
    fromShopId: SALAMART_DALANGAN,
    toShopId: SALAMART_PENGASIH,
    requestedBy: U_KSR_A1,
    confirmedBy: U_ADM_C,
    status: "rejected",
    note: "Request transfer sampo ke Pengasih — stok pusat tidak mencukupi",
    items: [{ variantId: V(22), qty: 10 }],
  },
  {
    date: "2026-04-15",
    fromShopId: SALAMART_DALANGAN,
    toShopId: SALAMART_CIKLI,
    requestedBy: U_ADM_A,
    confirmedBy: U_ADM_B,
    status: "approved",
    note: "Transfer stok susu UHT untuk promo Lebaran",
    items: [
      { variantId: V(18), qty: 60 },
      { variantId: V(19), qty: 50 },
    ],
  },
  {
    date: "2026-04-22",
    fromShopId: SALAMART_CIKLI,
    toShopId: SALAMART_PENGASIH,
    requestedBy: U_KSR_B1,
    confirmedBy: U_ADM_C,
    status: "approved",
    note: "Transfer stok snack menjelang akhir April",
    items: [
      { variantId: V(12), qty: 55 },
      { variantId: V(20), qty: 45 },
    ],
  },
  {
    date: "2026-04-28",
    fromShopId: SALAMART_PENGASIH,
    toShopId: SALAMART_DALANGAN,
    requestedBy: U_ADM_C,
    confirmedBy: null,
    status: "pending",
    note: "Return kelebihan stok air mineral ke pusat",
    items: [{ variantId: V(1), qty: 40 }],
  },
  {
    date: "2026-05-05",
    fromShopId: SALAMART_DALANGAN,
    toShopId: SALAMART_CIKLI,
    requestedBy: U_ADM_A,
    confirmedBy: U_ADM_B,
    status: "approved",
    note: "Restock Indomie ke Cikli awal Mei",
    items: [
      { variantId: V(7), qty: 120 },
      { variantId: V(8), qty: 100 },
    ],
  },
  {
    date: "2026-05-15",
    fromShopId: SALAMART_DALANGAN,
    toShopId: SALAMART_PENGASIH,
    requestedBy: U_ADM_A,
    confirmedBy: U_ADM_C,
    status: "approved",
    note: "Transfer stok minuman ke Pengasih pertengahan Mei",
    items: [
      { variantId: V(1), qty: 60 },
      { variantId: V(3), qty: 50 },
    ],
  },
];

// Monthly supplier restocks to keep stock healthy over 83-day period
const restockPlans = [
  {
    date: "2026-04-01",
    shopId: SALAMART_DALANGAN,
    userId: U_ADM_A,
    note: "Restock bulanan April — Salamart Dalangan",
    items: [
      { variantId: V(1), qty: 400, costPrice: 2000 },
      { variantId: V(2), qty: 200, costPrice: 4500 },
      { variantId: V(3), qty: 300, costPrice: 2800 },
      { variantId: V(4), qty: 120, costPrice: 5800 },
      { variantId: V(5), qty: 150, costPrice: 4500 },
      { variantId: V(6), qty: 100, costPrice: 6000 },
      { variantId: V(7), qty: 500, costPrice: 2500 },
      { variantId: V(8), qty: 400, costPrice: 2500 },
      { variantId: V(9), qty: 120, costPrice: 8000 },
      { variantId: V(10), qty: 100, costPrice: 8000 },
      { variantId: V(11), qty: 100, costPrice: 9500 },
      { variantId: V(12), qty: 130, costPrice: 6000 },
      { variantId: V(13), qty: 80, costPrice: 62000 },
      { variantId: V(14), qty: 40, costPrice: 120000 },
      { variantId: V(15), qty: 100, costPrice: 17000 },
      { variantId: V(16), qty: 60, costPrice: 33000 },
      { variantId: V(17), qty: 100, costPrice: 14000 },
      { variantId: V(18), qty: 160, costPrice: 3200 },
      { variantId: V(19), qty: 140, costPrice: 3200 },
      { variantId: V(20), qty: 130, costPrice: 3500 },
      { variantId: V(21), qty: 70, costPrice: 18000 },
      { variantId: V(22), qty: 40, costPrice: 20000 },
      { variantId: V(23), qty: 20, costPrice: 30000 },
    ],
  },
  {
    date: "2026-04-01",
    shopId: SALAMART_CIKLI,
    userId: U_ADM_B,
    note: "Restock bulanan April — Salamart Cikli",
    items: [
      { variantId: V(1), qty: 250, costPrice: 2000 },
      { variantId: V(3), qty: 180, costPrice: 2800 },
      { variantId: V(5), qty: 100, costPrice: 4500 },
      { variantId: V(6), qty: 70, costPrice: 6000 },
      { variantId: V(7), qty: 330, costPrice: 2500 },
      { variantId: V(8), qty: 270, costPrice: 2500 },
      { variantId: V(9), qty: 90, costPrice: 8000 },
      { variantId: V(12), qty: 90, costPrice: 6000 },
      { variantId: V(13), qty: 50, costPrice: 62000 },
      { variantId: V(15), qty: 70, costPrice: 17000 },
      { variantId: V(17), qty: 80, costPrice: 14000 },
      { variantId: V(18), qty: 110, costPrice: 3200 },
      { variantId: V(20), qty: 90, costPrice: 3500 },
      { variantId: V(21), qty: 50, costPrice: 18000 },
      { variantId: V(23), qty: 12, costPrice: 30000 },
    ],
  },
  {
    date: "2026-04-01",
    shopId: SALAMART_PENGASIH,
    userId: U_ADM_C,
    note: "Restock bulanan April — Salamart Pengasih",
    items: [
      { variantId: V(1), qty: 150, costPrice: 2000 },
      { variantId: V(3), qty: 100, costPrice: 2800 },
      { variantId: V(5), qty: 80, costPrice: 4500 },
      { variantId: V(7), qty: 180, costPrice: 2500 },
      { variantId: V(8), qty: 150, costPrice: 2500 },
      { variantId: V(9), qty: 60, costPrice: 8000 },
      { variantId: V(12), qty: 60, costPrice: 6000 },
      { variantId: V(13), qty: 30, costPrice: 62000 },
      { variantId: V(15), qty: 50, costPrice: 17000 },
      { variantId: V(17), qty: 50, costPrice: 14000 },
      { variantId: V(18), qty: 70, costPrice: 3200 },
      { variantId: V(20), qty: 55, costPrice: 3500 },
      { variantId: V(21), qty: 35, costPrice: 18000 },
      { variantId: V(23), qty: 8, costPrice: 30000 },
    ],
  },
  {
    date: "2026-05-01",
    shopId: SALAMART_DALANGAN,
    userId: U_ADM_A,
    note: "Restock bulanan Mei — Salamart Dalangan",
    items: [
      { variantId: V(1), qty: 350, costPrice: 2000 },
      { variantId: V(2), qty: 180, costPrice: 4500 },
      { variantId: V(3), qty: 250, costPrice: 2800 },
      { variantId: V(4), qty: 100, costPrice: 5800 },
      { variantId: V(5), qty: 130, costPrice: 4500 },
      { variantId: V(6), qty: 80, costPrice: 6000 },
      { variantId: V(7), qty: 450, costPrice: 2500 },
      { variantId: V(8), qty: 350, costPrice: 2500 },
      { variantId: V(9), qty: 100, costPrice: 8000 },
      { variantId: V(10), qty: 80, costPrice: 8000 },
      { variantId: V(11), qty: 80, costPrice: 9500 },
      { variantId: V(12), qty: 120, costPrice: 6000 },
      { variantId: V(13), qty: 60, costPrice: 62000 },
      { variantId: V(14), qty: 30, costPrice: 120000 },
      { variantId: V(15), qty: 90, costPrice: 17000 },
      { variantId: V(16), qty: 50, costPrice: 33000 },
      { variantId: V(17), qty: 80, costPrice: 14000 },
      { variantId: V(18), qty: 150, costPrice: 3200 },
      { variantId: V(19), qty: 130, costPrice: 3200 },
      { variantId: V(20), qty: 120, costPrice: 3500 },
      { variantId: V(21), qty: 60, costPrice: 18000 },
      { variantId: V(22), qty: 35, costPrice: 20000 },
      { variantId: V(23), qty: 18, costPrice: 30000 },
    ],
  },
  {
    date: "2026-05-01",
    shopId: SALAMART_CIKLI,
    userId: U_ADM_B,
    note: "Restock bulanan Mei — Salamart Cikli",
    items: [
      { variantId: V(1), qty: 220, costPrice: 2000 },
      { variantId: V(3), qty: 160, costPrice: 2800 },
      { variantId: V(5), qty: 90, costPrice: 4500 },
      { variantId: V(6), qty: 60, costPrice: 6000 },
      { variantId: V(7), qty: 300, costPrice: 2500 },
      { variantId: V(8), qty: 240, costPrice: 2500 },
      { variantId: V(9), qty: 80, costPrice: 8000 },
      { variantId: V(12), qty: 80, costPrice: 6000 },
      { variantId: V(13), qty: 45, costPrice: 62000 },
      { variantId: V(15), qty: 60, costPrice: 17000 },
      { variantId: V(17), qty: 70, costPrice: 14000 },
      { variantId: V(18), qty: 100, costPrice: 3200 },
      { variantId: V(20), qty: 80, costPrice: 3500 },
      { variantId: V(21), qty: 45, costPrice: 18000 },
      { variantId: V(23), qty: 10, costPrice: 30000 },
    ],
  },
  {
    date: "2026-05-01",
    shopId: SALAMART_PENGASIH,
    userId: U_ADM_C,
    note: "Restock bulanan Mei — Salamart Pengasih",
    items: [
      { variantId: V(1), qty: 130, costPrice: 2000 },
      { variantId: V(3), qty: 90, costPrice: 2800 },
      { variantId: V(5), qty: 70, costPrice: 4500 },
      { variantId: V(7), qty: 160, costPrice: 2500 },
      { variantId: V(8), qty: 130, costPrice: 2500 },
      { variantId: V(9), qty: 50, costPrice: 8000 },
      { variantId: V(12), qty: 55, costPrice: 6000 },
      { variantId: V(13), qty: 28, costPrice: 62000 },
      { variantId: V(15), qty: 45, costPrice: 17000 },
      { variantId: V(17), qty: 45, costPrice: 14000 },
      { variantId: V(18), qty: 65, costPrice: 3200 },
      { variantId: V(20), qty: 50, costPrice: 3500 },
      { variantId: V(21), qty: 30, costPrice: 18000 },
      { variantId: V(23), qty: 6, costPrice: 30000 },
    ],
  },
];

function buildCustomers() {
  const firstNames = [
    "Adi",
    "Agus",
    "Ani",
    "Budi",
    "Citra",
    "Dewi",
    "Eko",
    "Fajar",
    "Hana",
    "Indra",
    "Joko",
    "Lina",
    "Maya",
    "Nanda",
    "Putri",
    "Raka",
    "Sinta",
    "Teguh",
    "Wati",
    "Yuda",
    "Suryo",
    "Hesti",
    "Bambang",
    "Wahyu",
    "Sri",
    "Nur",
    "Paijo",
    "Maryati",
    "Slamet",
    "Triyono",
  ];
  const lastNames = [
    "Santoso",
    "Pratama",
    "Wulandari",
    "Kusuma",
    "Lestari",
    "Saputra",
    "Hidayat",
    "Rahma",
    "Wijaya",
    "Permata",
    "Utami",
    "Sari",
    "Aminah",
    "Hartono",
    "Sulaiman",
    "Rahayu",
    "Purnomo",
    "Setiawan",
    "Nugroho",
    "Wahyuni",
  ];
  const kelurahan = [
    "Triharjo, Wates",
    "Giripeni, Wates",
    "Ngestiharjo, Wates",
    "Hargorejo, Kokap",
    "Kalirejo, Kokap",
    "Hargomulyo, Kokap",
    "Kepek, Pengasih",
    "Sendangsari, Pengasih",
    "Clereng, Pengasih",
    "Margosari, Pengasih",
    "Karangsari, Pengasih",
    "Sidomulyo, Pengasih",
  ];
  const streetNames = [
    "Jl. Wates",
    "Jl. Pengasih",
    "Jl. Godean",
    "Jl. Kokap",
    "Jl. Nanggulan",
    "Jl. Sentolo",
    "Jl. Lendah",
    "Jl. Panjatan",
    "Jl. Temon",
    "Jl. Galur",
    "Jl. Triharjo",
    "Jl. Kepek",
  ];
  const phonePrefix = [
    "0811",
    "0812",
    "0813",
    "0821",
    "0822",
    "0823",
    "0852",
    "0853",
    "0857",
    "0878",
    "0895",
    "0896",
  ];
  const rows = [];

  for (let i = 1; i <= 60; i++) {
    const first = faker.helpers.arrayElement(firstNames);
    const last = faker.helpers.arrayElement(lastNames);
    const prefix = phonePrefix[(i - 1) % phonePrefix.length];
    const suffix = String(10000000 + i * 137).slice(1, 9);
    const street = streetNames[(i - 1) % streetNames.length];
    const no = ((i * 7 + 3) % 99) + 1;
    const kel = kelurahan[(i - 1) % kelurahan.length];
    rows.push({
      id: `44444444-4444-4444-8444-4444444400${String(i).padStart(2, "0")}`,
      name: `${first} ${last}`,
      phone: `${prefix}${suffix}`,
      email:
        i % 4 === 0
          ? null
          : `${first.toLowerCase()}.${last.toLowerCase()}${i}@gmail.com`,
      address: `${street} No. ${no}, ${kel}, Kabupaten Kulon Progo`,
      loyal: i <= 5,
    });
  }
  return rows;
}

const customerRows = buildCustomers();

function buildStaticData() {
  const shops = [
    {
      id: SALAMART_DALANGAN,
      name: "Salamart Dalangan",
      address: "Dalangan, Triharjo, Wates, Kabupaten Kulon Progo, DIY 55651",
      phone: "085712340001",
      is_active: true,
    },
    {
      id: SALAMART_CIKLI,
      name: "Salamart Cikli",
      address:
        "Jl. Ki Josuto, Polodadi, Hargorejo, Kec. Kokap, Kabupaten Kulon Progo, DIY 55654",
      phone: "085712340002",
      is_active: true,
    },
    {
      id: SALAMART_PENGASIH,
      name: "Salamart Pengasih",
      address:
        "Jl. Pengasih - Wates, Kepek, Pengasih, Kec. Pengasih, Kabupaten Kulon Progo, DIY 55664",
      phone: "085712340003",
      is_active: true,
    },
  ];

  const users = [
    {
      id: U_SUPER,
      name: "Rizky Aziz",
      email: "rizkyaziz214@gmail.com",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "superAdmin",
      phone: "081234560001",
      is_active: true,
    },
    {
      id: U_ADM_A,
      name: "Budi Hartono",
      email: "admin.dalangan@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "admin",
      phone: "081234560002",
      is_active: true,
    },
    {
      id: U_ADM_B,
      name: "Sari Dewi",
      email: "admin.cikli@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "admin",
      phone: "081234560003",
      is_active: true,
    },
    {
      id: U_ADM_C,
      name: "Hendra Kusuma",
      email: "admin.pengasih@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "admin",
      phone: "081234560004",
      is_active: true,
    },
    {
      id: U_KSR_A1,
      name: "Rina Wulandari",
      email: "kasir1.dalangan@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "user",
      phone: "082123450001",
      is_active: true,
    },
    {
      id: U_KSR_A2,
      name: "Doni Prasetyo",
      email: "kasir2.dalangan@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "user",
      phone: "082123450002",
      is_active: true,
    },
    {
      id: U_KSR_B1,
      name: "Yanti Susanti",
      email: "kasir1.cikli@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "user",
      phone: "082123450003",
      is_active: true,
    },
    {
      id: U_KSR_C1,
      name: "Agus Setiawan",
      email: "kasir1.pengasih@salamart.id",
      password: "$2b$10$xswrnQB7iSJJ4Ej5G4W2YuJDr8so9QwrntPu5ZJhNeDKkAItVd1.C",
      role: "user",
      phone: "082123450004",
      is_active: true,
    },
  ];

  const userShops = [
    { user_id: U_ADM_A, shop_id: SALAMART_DALANGAN },
    { user_id: U_KSR_A1, shop_id: SALAMART_DALANGAN },
    { user_id: U_KSR_A2, shop_id: SALAMART_DALANGAN },
    { user_id: U_ADM_B, shop_id: SALAMART_CIKLI },
    { user_id: U_KSR_B1, shop_id: SALAMART_CIKLI },
    { user_id: U_ADM_C, shop_id: SALAMART_PENGASIH },
    { user_id: U_KSR_C1, shop_id: SALAMART_PENGASIH },
  ];

  const customers = customerRows.map(({ loyal: _loyal, ...rest }) => rest);
  return {
    shops,
    users,
    userShops,
    categoryRows,
    customers,
    productRows,
    variantRows,
  };
}

function buildInventorySeedRows() {
  const rows = [];
  const state = new Map();
  let idx = 1;

  for (const shopId of [SALAMART_DALANGAN, SALAMART_CIKLI, SALAMART_PENGASIH]) {
    const shopKey =
      shopId === SALAMART_DALANGAN
        ? "A"
        : shopId === SALAMART_CIKLI
          ? "B"
          : "C";
    const idPrefix =
      shopId === SALAMART_DALANGAN
        ? "77777777-7777-4777-8777-"
        : shopId === SALAMART_CIKLI
          ? "77777777-7777-4777-8778-"
          : "77777777-7777-4777-8779-";
    const stockScale = shopKey === "C" ? 2.1 : 1.9;

    for (const variantIndex of shopInventoryVariants[shopId]) {
      const variant = variantRows.find((v) => v.id === V(variantIndex));
      const stock = Math.round(variant.initial_stock[shopKey] * stockScale);
      if (stock <= 0) continue;

      state.set(`${shopId}:${variant.id}`, {
        stock,
        avgCost: variant.cost_price,
      });
      rows.push({
        id: I(idPrefix, idx),
        shop_id: shopId,
        product_variant_id: variant.id,
        stock,
        reserved_stock: 0,
        avg_cost_price: variant.cost_price,
        low_stock_threshold: variant.low_stock_threshold[shopKey],
        updated_at: DATE_END,
      });
      idx++;
    }
  }
  return { rows, state };
}

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

function getVariantById(id) {
  return variantRows.find((v) => v.id === id);
}
function getState(state, shopId, vid) {
  return state.get(`${shopId}:${vid}`);
}
function setState(state, shopId, vid, s) {
  state.set(`${shopId}:${vid}`, s);
}
function getShopProfile(shopId) {
  return shopUsers[shopId];
}

function getCategoryMultiplier(variant, date, shopId) {
  const day = date.getUTCDate();
  const weekday = date.getUTCDay();
  const month = date.getUTCMonth(); // 2=Mar, 3=Apr, 4=May
  const shopKey =
    shopId === SALAMART_DALANGAN ? "A" : shopId === SALAMART_CIKLI ? "B" : "C";
  let m = variant.demand[shopKey];

  if (month === 2) m *= 1.25; // March = Lebaran peak
  if (month === 3) m *= 1.15; // April = post-Lebaran

  if (weekday === 0 || weekday === 6) {
    if (variant.category_id === C_MNM || variant.category_id === C_SNK)
      m *= 1.25;
    else if (variant.category_id === C_SMB) m *= 1.15;
  }

  if (day <= 5 && variant.category_id === C_SMB) m *= 1.7;
  if (day >= 25 && variant.product_id === P(5)) m *= 5;
  if (variant.id === V(23)) m *= 0.06;

  return m;
}

function getDailyTransactionTarget(shopId, date) {
  const base =
    shopId === SALAMART_DALANGAN ? 33 : shopId === SALAMART_CIKLI ? 22 : 13;
  const weekendBoost = [0, 6].includes(date.getUTCDay())
    ? shopId === SALAMART_DALANGAN
      ? 1.18
      : shopId === SALAMART_CIKLI
        ? 1.22
        : 1.25
    : 1;
  const month = date.getUTCMonth();
  const monthBoost = month === 2 ? 1.2 : month === 3 ? 1.1 : 1;
  const lateBoost = date.getUTCDate() >= 25 ? 1.1 : 1;
  return Math.max(
    1,
    Math.round(base * weekendBoost * monthBoost * lateBoost + randomInt(-2, 2)),
  );
}

function getItemCount(shopId, date) {
  const wknd = [0, 6].includes(date.getUTCDay());
  if (shopId === SALAMART_DALANGAN) return randomInt(2, wknd ? 5 : 4);
  if (shopId === SALAMART_CIKLI) return randomInt(2, wknd ? 4 : 3);
  return randomInt(1, wknd ? 3 : 2);
}

function pickCustomer(date, txIndex) {
  if (txIndex % 5 === 0) {
    const loyal = customerRows.filter((c) => c.loyal);
    return loyal[(date.getUTCDate() + txIndex) % loyal.length].id;
  }
  if (randomInt(1, 100) <= 30) return null;
  const eligible = customerRows.filter((c) => !c.loyal);
  return eligible[(date.getUTCDate() + txIndex) % eligible.length].id;
}

function pickUser(shopId) {
  const profile = getShopProfile(shopId);
  if (profile.cashiers.length === 0) return profile.admin;
  return faker.helpers.arrayElement([...profile.cashiers, profile.admin]);
}

function buildBasket(shopId, date, state) {
  const basket = [];
  const picked = new Set();
  const targetCount = getItemCount(shopId, date);
  const activeVariants = shopInventoryVariants[shopId]
    .map((vi) => getVariantById(V(vi)))
    .filter(Boolean);

  let attempts = 0;
  while (basket.length < targetCount && attempts < 30) {
    attempts++;
    const candidates = activeVariants
      .filter((v) => !picked.has(v.id))
      .map((v) => ({
        value: v,
        weight: Math.max(getCategoryMultiplier(v, date, shopId), 0.01),
      }));

    if (!candidates.length) break;

    const variant = weightedChoice(candidates);
    const current = getState(state, shopId, variant.id);
    if (!current || current.stock <= 0) {
      picked.add(variant.id);
      continue;
    }

    let qty = 1;
    if (variant.category_id === C_SMB) qty = randomInt(1, 4);
    else if (variant.category_id === C_SNK) qty = randomInt(1, 3);
    else if (variant.category_id === C_MNM) qty = randomInt(1, 4);
    else if (variant.category_id === C_SSU) qty = randomInt(1, 3);
    else if (variant.category_id === C_KBR) qty = randomInt(1, 2);

    if (date.getUTCDate() >= 25 && variant.product_id === P(5))
      qty += randomInt(1, 2);
    if (
      [0, 6].includes(date.getUTCDay()) &&
      (variant.category_id === C_MNM || variant.category_id === C_SNK)
    )
      qty += 1;

    qty = Math.min(qty, current.stock);
    if (qty < 1) {
      picked.add(variant.id);
      continue;
    }

    basket.push({ variant, qty, current });
    picked.add(variant.id);
  }
  return basket;
}

function buildSyntheticData() {
  faker.seed(20260510);

  const staticData = buildStaticData();
  const { rows: initialInventoryRows, state: initialState } =
    buildInventorySeedRows();
  const state = new Map(
    Array.from(initialState.entries(), ([k, v]) => [k, { ...v }]),
  );
  const inventoryRows = initialInventoryRows.map((r) => ({ ...r }));

  const transactions = [];
  const transactionItems = [];
  const refunds = [];
  const refundItems = [];
  const transfers = [];
  const transferItems = [];
  const stockMovements = [];

  let txCounter = 1;
  let txItemCounter = 1;
  let saleMvCounter = 1;
  let tfrCounter = 1;
  let tfrItemCounter = 1;
  let tfrMvCounter = 1;
  let refCounter = 1;
  let refItemCounter = 1;
  let refMvCounter = 1;
  let restockMidCounter = 1;
  let invoiceCounter = 1;

  // Initial restock movements
  for (const row of initialInventoryRows) {
    const variant = getVariantById(row.product_variant_id);
    stockMovements.push({
      id: SM("0", saleMvCounter++),
      shop_id: row.shop_id,
      user_id:
        row.shop_id === SALAMART_DALANGAN
          ? U_ADM_A
          : row.shop_id === SALAMART_CIKLI
            ? U_ADM_B
            : U_ADM_C,
      product_variant_id: row.product_variant_id,
      transaction_id: null,
      transfer_id: null,
      type: "restock",
      qty: row.stock,
      cost_price: variant.cost_price,
      stock_before: 0,
      stock_after: row.stock,
      avg_cost_before: 0,
      avg_cost_after: variant.cost_price,
      note: "Restock awal simulasi Maret 2026",
      created_at: INITIAL_RESTOCK_DATE,
    });
  }

  const loyalSchedule = loyalProfiles.map((p) => ({ ...p }));
  const refundQueue = [];
  const dayCursor = new Date(DATE_START);

  while (dayCursor <= DATE_END) {
    const dayKey = makeDayKey(dayCursor);

    // Process queued refunds due today
    for (let i = refundQueue.length - 1; i >= 0; i--) {
      const plan = refundQueue[i];
      if (plan.dayKey !== dayKey) continue;

      const refundId = R(refCounter);
      const refTime = dateAt(dayKey, 10, 15 + ((refCounter + i) % 30));
      const shopAdmin = getShopProfile(plan.shopId).admin;
      const current = getState(state, plan.shopId, plan.variantId);

      if (!current) {
        refundQueue.splice(i, 1);
        continue;
      }

      refunds.push({
        id: refundId,
        user_id: shopAdmin,
        transaction_id: plan.transactionId,
        reason: plan.reason,
        total_amount: plan.amount,
        status: "approved",
        created_at: refTime,
        updated_at: refTime,
      });

      refundItems.push({
        id: RI(refItemCounter),
        refund_id: refundId,
        transaction_item_id: plan.transactionItemId,
        qty: plan.qty,
        amount: plan.amount,
      });

      stockMovements.push({
        id: SM("3", refMvCounter++),
        shop_id: plan.shopId,
        user_id: shopAdmin,
        product_variant_id: plan.variantId,
        transaction_id: plan.transactionId,
        transfer_id: null,
        type: "refund",
        qty: plan.qty,
        cost_price: null,
        stock_before: current.stock,
        stock_after: current.stock + plan.qty,
        avg_cost_before: current.avgCost,
        avg_cost_after: current.avgCost,
        note: plan.reason,
        created_at: refTime,
      });

      setState(state, plan.shopId, plan.variantId, {
        ...current,
        stock: current.stock + plan.qty,
      });
      refCounter++;
      refItemCounter++;
      refundQueue.splice(i, 1);
    }

    // Monthly supplier restocks
    for (const plan of restockPlans.filter((p) => p.date === dayKey)) {
      const restockTime = dateAt(dayKey, 8, 0);
      for (const item of plan.items) {
        const current = getState(state, plan.shopId, item.variantId);
        if (!current) continue;

        const newStock = current.stock + item.qty;
        const newAvgCost =
          current.stock === 0
            ? item.costPrice
            : Math.round(
                (current.stock * current.avgCost + item.qty * item.costPrice) /
                  newStock,
              );

        stockMovements.push({
          id: SM("4", restockMidCounter++),
          shop_id: plan.shopId,
          user_id: plan.userId,
          product_variant_id: item.variantId,
          transaction_id: null,
          transfer_id: null,
          type: "restock",
          qty: item.qty,
          cost_price: item.costPrice,
          stock_before: current.stock,
          stock_after: newStock,
          avg_cost_before: current.avgCost,
          avg_cost_after: newAvgCost,
          note: plan.note,
          created_at: restockTime,
        });

        setState(state, plan.shopId, item.variantId, {
          stock: newStock,
          avgCost: newAvgCost,
        });
      }
    }

    // Daily transactions per shop
    for (const shopId of [
      SALAMART_DALANGAN,
      SALAMART_CIKLI,
      SALAMART_PENGASIH,
    ]) {
      const scheduledVisits = loyalSchedule.filter(
        (s) => s.shopId === shopId && s.nextVisit === dayKey,
      );
      const targetCount = getDailyTransactionTarget(shopId, dayCursor);
      const extraCount = Math.max(targetCount - scheduledVisits.length, 0);

      const createTransaction = (customerId) => {
        const txTime = dateAt(dayKey, randomInt(8, 20), randomInt(0, 59));
        const userId = pickUser(shopId);
        const basket = buildBasket(shopId, dayCursor, state);
        if (!basket.length) return null;

        const txId = T(txCounter);
        const subtotal = basket.reduce(
          (s, it) => s + it.variant.price * it.qty,
          0,
        );
        const payMethod = weightedChoice([
          { value: "cash", weight: 55 },
          { value: "qris", weight: 45 },
        ]);

        transactions.push({
          id: txId,
          shop_id: shopId,
          user_id: userId,
          customer_id: customerId,
          invoice_no: `INV/2026/${dayKey.slice(5, 7)}/${String(invoiceCounter).padStart(6, "0")}`,
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
                  "Promo Lebaran",
                  "Belanja bulanan",
                ]),
          created_at: new Date(txTime.getTime() - 2 * 60 * 1000),
          updated_at: txTime,
        });

        let refundableItem = null;

        for (const item of basket) {
          const txItemId = TI(txItemCounter);
          transactionItems.push({
            id: txItemId,
            transaction_id: txId,
            product_variant_id: item.variant.id,
            qty: item.qty,
            price: item.variant.price,
            cost_price: item.variant.cost_price,
            subtotal: item.variant.price * item.qty,
          });

          stockMovements.push({
            id: SM("1", saleMvCounter++),
            shop_id: shopId,
            user_id: userId,
            product_variant_id: item.variant.id,
            transaction_id: txId,
            transfer_id: null,
            type: "sale",
            qty: -item.qty,
            cost_price: null,
            stock_before: item.current.stock,
            stock_after: item.current.stock - item.qty,
            avg_cost_before: item.current.avgCost,
            avg_cost_after: item.current.avgCost,
            note: null,
            created_at: txTime,
          });

          setState(state, shopId, item.variant.id, {
            ...item.current,
            stock: item.current.stock - item.qty,
          });

          if (!refundableItem && item.qty > 1) {
            refundableItem = {
              transactionItemId: txItemId,
              variant: item.variant,
              qty: item.qty,
              amount: item.variant.price * item.qty,
            };
          }
          txItemCounter++;
        }

        txCounter++;
        invoiceCounter++;

        if (dayCursor < DATE_END && refundableItem && randomInt(1, 100) <= 4) {
          const rQty = Math.max(
            1,
            Math.min(refundableItem.qty - 1, randomInt(1, 2)),
          );
          refundQueue.push({
            dayKey: makeDayKey(new Date(dayCursor.getTime() + 86400000)),
            shopId,
            transactionId: txId,
            transactionItemId: refundableItem.transactionItemId,
            variantId: refundableItem.variant.id,
            qty: rQty,
            amount: refundableItem.variant.price * rQty,
            reason: `Refund parsial ${refundableItem.variant.name}`,
          });
        }

        return txId;
      };

      for (const visit of scheduledVisits) {
        createTransaction(visit.customerId);
        const next = new Date(dayCursor.getTime());
        next.setUTCDate(
          next.getUTCDate() + randomInt(visit.interval[0], visit.interval[1]),
        );
        visit.nextVisit = makeDayKey(next);
      }

      for (let i = 0; i < extraCount; i++) {
        createTransaction(pickCustomer(dayCursor, i));
      }
    }

    // Transfer plans for today
    for (const plan of transferPlans.filter((p) => p.date === dayKey)) {
      const tfrId = TRF(tfrCounter);
      const createdAt = dateAt(dayKey, 10, plan.status === "pending" ? 25 : 15);
      const confirmedAt =
        plan.status === "approved"
          ? new Date(createdAt.getTime() + 45 * 60 * 1000)
          : plan.status === "rejected"
            ? new Date(createdAt.getTime() + 30 * 60 * 1000)
            : null;
      const targetAdmin = getShopProfile(plan.toShopId).admin;

      transfers.push({
        id: tfrId,
        from_shop_id: plan.fromShopId,
        to_shop_id: plan.toShopId,
        requested_by: plan.requestedBy,
        confirmed_by: plan.confirmedBy,
        status: plan.status,
        note: plan.note,
        created_at: createdAt,
        confirmed_at: confirmedAt,
        updated_at: confirmedAt ?? createdAt,
      });

      for (const item of plan.items) {
        transferItems.push({
          id: TRFI(tfrItemCounter),
          transfer_id: tfrId,
          product_variant_id: item.variantId,
          qty: item.qty,
        });
        tfrItemCounter++;

        if (plan.status !== "approved") continue;

        const sourceState = getState(state, plan.fromShopId, item.variantId);
        const targetState = getState(state, plan.toShopId, item.variantId);
        if (!sourceState) continue;

        const transferQty = Math.min(item.qty, sourceState.stock);
        const tfrTime = confirmedAt;

        stockMovements.push({
          id: SM("2", tfrMvCounter++),
          shop_id: plan.fromShopId,
          user_id: plan.requestedBy,
          product_variant_id: item.variantId,
          transaction_id: null,
          transfer_id: tfrId,
          type: "transfer_out",
          qty: -transferQty,
          cost_price: null,
          stock_before: sourceState.stock,
          stock_after: sourceState.stock - transferQty,
          avg_cost_before: sourceState.avgCost,
          avg_cost_after: sourceState.avgCost,
          note: plan.note,
          created_at: tfrTime,
        });

        stockMovements.push({
          id: SM("2", tfrMvCounter++),
          shop_id: plan.toShopId,
          user_id: targetAdmin,
          product_variant_id: item.variantId,
          transaction_id: null,
          transfer_id: tfrId,
          type: "transfer_in",
          qty: transferQty,
          cost_price: null,
          stock_before: targetState ? targetState.stock : 0,
          stock_after: (targetState ? targetState.stock : 0) + transferQty,
          avg_cost_before: targetState
            ? targetState.avgCost
            : sourceState.avgCost,
          avg_cost_after: targetState
            ? targetState.avgCost
            : sourceState.avgCost,
          note: plan.note,
          created_at: tfrTime,
        });

        setState(state, plan.fromShopId, item.variantId, {
          ...sourceState,
          stock: sourceState.stock - transferQty,
        });
        if (targetState) {
          setState(state, plan.toShopId, item.variantId, {
            ...targetState,
            stock: targetState.stock + transferQty,
          });
        } else {
          setState(state, plan.toShopId, item.variantId, {
            stock: transferQty,
            avgCost: sourceState.avgCost,
          });
        }
      }

      tfrCounter++;
    }

    dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
  }

  const finalInventory = inventoryRows.map((row) => {
    const cur = getState(state, row.shop_id, row.product_variant_id);
    return {
      ...row,
      stock: cur ? cur.stock : row.stock,
      avg_cost_price: cur ? cur.avgCost : row.avg_cost_price,
      updated_at: DATE_END,
    };
  });

  const initialRestockMovements = stockMovements.filter(
    (m) => m.type === "restock" && m.id.startsWith("cccccccc-cccc-4ccc-8ccc-0"),
  );
  const midRestockMovements = stockMovements.filter(
    (m) => m.type === "restock" && m.id.startsWith("cccccccc-cccc-4ccc-8ccc-4"),
  );
  const saleMovements = stockMovements.filter((m) => m.type === "sale");
  const transferMovements = stockMovements.filter(
    (m) => m.type === "transfer_out" || m.type === "transfer_in",
  );
  const refundMovements = stockMovements.filter((m) => m.type === "refund");

  return {
    ...staticData,
    inventory: finalInventory,
    inventoryState: state,
    initialRestockMovements,
    midRestockMovements,
    transactions,
    transactionItems,
    transfers,
    transferItems,
    refunds,
    refundItems,
    saleMovements,
    transferMovements,
    refundMovements,
    stockMovements,
  };
}

let cached = null;

function getSyntheticSeedData() {
  if (cached) return cached;
  cached = buildSyntheticData();
  return cached;
}

module.exports = {
  getSyntheticSeedData,
  SALAMART_DALANGAN,
  SALAMART_CIKLI,
  SALAMART_PENGASIH,
  U_SUPER,
  U_ADM_A,
  U_ADM_B,
  U_ADM_C,
  U_KSR_A1,
  U_KSR_A2,
  U_KSR_B1,
  U_KSR_C1,
  C_MNM,
  C_SNK,
  C_SMB,
  C_SSU,
  C_KBR,
  P,
  V,
  I,
  T,
  TI,
  TRF,
  TRFI,
  SM,
  R,
  RI,
};
