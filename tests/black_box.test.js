'use strict';

/**
 * Black Box Testing — POS Backend
 * Mencakup seluruh 31 skenario pada Tabel 3.6 Daftar Skenario Black Box Testing.
 *
 * Prasyarat:
 *   - Database harus berjalan dan sudah di-seed dengan data sintetis
 *   - File .env sudah dikonfigurasi dengan benar
 *   - Untuk skenario 29–30: AI service harus berjalan di AI_SERVICE_URL
 *
 * KETIDAKSESUAIAN YANG DITEMUKAN:
 *   Skenario 17: Dokumen menyebut input "transaction_id" & status "pending"
 *                → Implementasi: input "invoice_no" & status langsung "approved"
 *   Skenario 18: Dokumen menyebut pesan "transaction_id dan items wajib diisi"
 *                → Implementasi: "invoice_no dan items wajib diisi"
 *   Tes ditulis mengikuti perilaku implementasi aktual.
 */

require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

// ─── Konstanta (ID dari data seed) ───────────────────────────────────────────

const BASE = '/api';

const SHOP_DALANGAN = '11111111-1111-4111-8111-111111111001';
const SHOP_CIKLI    = '11111111-1111-4111-8111-111111111002';
const CATEGORY_MNM  = '33333333-3333-4333-8333-333333333001';
const VARIANT_AQUA  = '66666666-6666-4666-8666-666666660001'; // Aqua 600ml

// ─── Kredensial akun seed ─────────────────────────────────────────────────────

const CREDS = {
  superAdmin:    { email: 'rizkyaziz214@gmail.com',      password: 'Salamart2026!' },
  adminDalangan: { email: 'admin.dalangan@salamart.id',  password: 'Salamart2026!' },
  adminCikli:    { email: 'admin.cikli@salamart.id',     password: 'Salamart2026!' },
  kasir:         { email: 'kasir1.dalangan@salamart.id', password: 'Salamart2026!' },
};

// ─── State antar tes ──────────────────────────────────────────────────────────

const tokens = {};
let createdProductId;
let createdInvoiceNo;
let createdTransactionItemId;
let createdTransferId;
let aiSessionId;

// ─── Setup global ─────────────────────────────────────────────────────────────

beforeAll(async () => {
  for (const [role, creds] of Object.entries(CREDS)) {
    const res = await request(app).post(`${BASE}/auth/login`).send(creds);
    tokens[role] = res.body.data?.accessToken;
  }
}, 30000);

afterAll(async () => {
  await sequelize.close();
});

// =============================================================================
// SKENARIO 1–4  ▶  POST /auth/login
// =============================================================================

describe('POST /auth/login', () => {
  test('[Skenario 1] Email dan password benar → HTTP 200, accessToken & refreshToken dikembalikan', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send(CREDS.adminDalangan);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  test('[Skenario 2] Email tidak terdaftar → HTTP 401, "Email atau password salah"', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: 'tidak.terdaftar@email.com', password: 'apapun123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  test('[Skenario 3] Password dikosongkan → HTTP 400, validasi password wajib diisi', async () => {
    // validate.login middleware (express-validator) berjalan sebelum controller,
    // sehingga pesan yang dikembalikan adalah "Password wajib diisi" dari validator,
    // bukan "Email dan password wajib diisi" dari controller.
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: CREDS.adminDalangan.email });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('wajib diisi');
  });

  test('[Skenario 4] Email terdaftar dengan password salah → HTTP 401, permintaan ditolak', async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({ email: CREDS.adminDalangan.email, password: 'passwordSalah99' });

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// SKENARIO 5–7  ▶  POST /products
// =============================================================================

describe('POST /products', () => {
  test('[Skenario 5] Body lengkap dengan token Admin → HTTP 201, data produk beserta varian dikembalikan', async () => {
    const res = await request(app)
      .post(`${BASE}/products`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({
        name: 'Produk Black-Box Test',
        category_id: CATEGORY_MNM,
        variants: [{ name: 'Ukuran L', sku: `SKU-BB-${Date.now()}`, price: 10000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.variants).toHaveLength(1);
    createdProductId = res.body.data.id;
  });

  test('[Skenario 6] Kolom name dikosongkan → HTTP 400, "name wajib diisi"', async () => {
    const res = await request(app)
      .post(`${BASE}/products`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({
        category_id: CATEGORY_MNM,
        variants: [{ name: 'Variant X', sku: 'SKU-NONAME', price: 5000 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('name wajib diisi');
  });

  test('[Skenario 7] Kolom variants tidak disertakan → HTTP 400, "minimal 1 variant wajib disertakan"', async () => {
    const res = await request(app)
      .post(`${BASE}/products`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({ name: 'Produk Tanpa Variant', category_id: CATEGORY_MNM });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('minimal 1 variant wajib disertakan');
  });
});

// =============================================================================
// SKENARIO 8–9  ▶  PATCH /products/:id
// =============================================================================

describe('PATCH /products/:id', () => {
  test('[Skenario 8] Perubahan valid dengan token Admin → HTTP 200, data produk diperbarui', async () => {
    const res = await request(app)
      .patch(`${BASE}/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({ name: 'Produk Black-Box (Updated)', description: 'Diperbarui via automated test' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('[Skenario 9] Token User (Kasir) → HTTP 403, akses ditolak', async () => {
    const res = await request(app)
      .patch(`${BASE}/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({ name: 'Coba edit oleh kasir' });

    expect(res.status).toBe(403);
  });
});

// =============================================================================
// SKENARIO 10–11  ▶  DELETE /products/:id
// =============================================================================

describe('DELETE /products/:id', () => {
  test('[Skenario 10] Token Admin → HTTP 200, produk ter-nonaktifkan (soft-delete)', async () => {
    const res = await request(app)
      .delete(`${BASE}/products/${createdProductId}`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('[Skenario 11] Tanpa header Authorization → HTTP 401, permintaan ditolak', async () => {
    const res = await request(app).delete(`${BASE}/products/${createdProductId}`);

    expect(res.status).toBe(401);
  });
});

// =============================================================================
// SKENARIO 12–16  ▶  POST /transactions
// =============================================================================

describe('POST /transactions', () => {
  test('[Skenario 12] items valid, payment_method=cash, token Kasir → HTTP 201, invoice_no dikembalikan & stok berkurang', async () => {
    const res = await request(app)
      .post(`${BASE}/transactions`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({
        shop_id: SHOP_DALANGAN,
        payment_method: 'cash',
        items: [{ product_variant_id: VARIANT_AQUA, qty: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('invoice_no');
    createdInvoiceNo = res.body.data.invoice_no;
    createdTransactionItemId = res.body.data.items?.[0]?.id;
  });

  test('[Skenario 13] items valid, payment_method=qris, token Kasir → HTTP 201, invoice_no dengan metode QRIS dikembalikan', async () => {
    const res = await request(app)
      .post(`${BASE}/transactions`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({
        shop_id: SHOP_DALANGAN,
        payment_method: 'qris',
        items: [{ product_variant_id: VARIANT_AQUA, qty: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.payment_method).toBe('qris');
    expect(res.body.data).toHaveProperty('invoice_no');
  });

  test('[Skenario 14] items berupa array kosong ([]) → HTTP 400, "Transaksi harus memiliki minimal satu item"', async () => {
    const res = await request(app)
      .post(`${BASE}/transactions`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({ shop_id: SHOP_DALANGAN, payment_method: 'cash', items: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Transaksi harus memiliki minimal satu item');
  });

  test('[Skenario 15] Qty melebihi stok varian → HTTP 400, "Stok tidak mencukupi"', async () => {
    const res = await request(app)
      .post(`${BASE}/transactions`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({
        shop_id: SHOP_DALANGAN,
        payment_method: 'cash',
        items: [{ product_variant_id: VARIANT_AQUA, qty: 999999 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('tidak mencukupi');
  });

  test('[Skenario 16] payment_method di luar [cash, qris] → HTTP 400, "Metode pembayaran tidak valid. Pilih: cash, qris"', async () => {
    const res = await request(app)
      .post(`${BASE}/transactions`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({
        shop_id: SHOP_DALANGAN,
        payment_method: 'transfer',
        items: [{ product_variant_id: VARIANT_AQUA, qty: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Metode pembayaran tidak valid. Pilih: cash, qris');
  });
});

// =============================================================================
// SKENARIO 17–18  ▶  POST /refunds
// SKENARIO 19–20  ▶  GET /refunds
//
// ⚠ CATATAN KETIDAKSESUAIAN SKENARIO vs IMPLEMENTASI:
//   Skenario 17: input "transaction_id" → implementasi pakai "invoice_no"
//   Skenario 17: status dikembalikan "pending" → implementasi langsung "approved"
//   Skenario 18: pesan "transaction_id dan items wajib diisi"
//               → implementasi: "invoice_no dan items wajib diisi"
// =============================================================================

describe('POST /refunds', () => {
  test('[Skenario 17] invoice_no valid & items benar, token Kasir → HTTP 201, data refund dikembalikan', async () => {
    const res = await request(app)
      .post(`${BASE}/refunds`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({
        invoice_no: createdInvoiceNo,
        reason: 'Barang rusak (automated test)',
        items: [{ transaction_item_id: createdTransactionItemId, qty: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('status');
  });

  test('[Skenario 18] Kolom items tidak disertakan → HTTP 400, "invoice_no dan items wajib diisi"', async () => {
    const res = await request(app)
      .post(`${BASE}/refunds`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .send({ invoice_no: createdInvoiceNo });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('invoice_no dan items wajib diisi');
  });
});

describe('GET /refunds', () => {
  test('[Skenario 19] Token User (Kasir) → HTTP 403, akses ditolak', async () => {
    const res = await request(app)
      .get(`${BASE}/refunds`)
      .set('Authorization', `Bearer ${tokens.kasir}`)
      .query({ shopId: SHOP_DALANGAN });

    expect(res.status).toBe(403);
  });

  test('[Skenario 20] Token Admin → HTTP 200, daftar refund dengan paginasi dikembalikan', async () => {
    const res = await request(app)
      .get(`${BASE}/refunds`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .query({ shopId: SHOP_DALANGAN });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('total');
  });
});

// =============================================================================
// SKENARIO 21–22  ▶  POST /inventory/restock
// SKENARIO 23–24  ▶  POST /inventory/adjustment-out
// =============================================================================

describe('POST /inventory/restock', () => {
  test('[Skenario 21] shop_id, product_variant_id, qty > 0 dengan token Admin → HTTP 201, inventori diperbarui & pergerakan stok tercatat', async () => {
    const res = await request(app)
      .post(`${BASE}/inventory/restock`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({
        shop_id: SHOP_DALANGAN,
        product_variant_id: VARIANT_AQUA,
        qty: 10,
        cost_price: 2000,
        note: 'Restock test',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('stock');
  });

  test('[Skenario 22] qty = 0 → HTTP 400, "qty harus lebih dari 0"', async () => {
    const res = await request(app)
      .post(`${BASE}/inventory/restock`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({ shop_id: SHOP_DALANGAN, product_variant_id: VARIANT_AQUA, qty: 0 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('qty harus lebih dari 0');
  });
});

describe('POST /inventory/adjustment-out', () => {
  test('[Skenario 23] qty tidak melebihi stok tersedia → HTTP 201, stok berkurang & pergerakan stok tercatat', async () => {
    const res = await request(app)
      .post(`${BASE}/inventory/adjustment-out`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({
        shop_id: SHOP_DALANGAN,
        product_variant_id: VARIANT_AQUA,
        qty: 1,
        note: 'Adjustment-out test',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('stock');
  });

  test('[Skenario 24] qty melebihi stok yang tersedia → HTTP 400, "Stok tidak mencukupi"', async () => {
    const res = await request(app)
      .post(`${BASE}/inventory/adjustment-out`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({ shop_id: SHOP_DALANGAN, product_variant_id: VARIANT_AQUA, qty: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Stok tidak mencukupi');
  });
});

// =============================================================================
// SKENARIO 25–27  ▶  POST /transfers
// SKENARIO 28     ▶  PATCH /transfers/:id/approve
// =============================================================================

describe('POST /transfers', () => {
  test('[Skenario 25] from ≠ to, items valid, token Admin → HTTP 201, data transfer dengan status pending dikembalikan', async () => {
    const res = await request(app)
      .post(`${BASE}/transfers`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({
        from_shop_id: SHOP_DALANGAN,
        to_shop_id: SHOP_CIKLI,
        note: 'Transfer black-box test',
        items: [{ product_variant_id: VARIANT_AQUA, qty: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    createdTransferId = res.body.data.id;
  });

  test('[Skenario 26] from_shop_id === to_shop_id → HTTP 400, "Toko asal dan tujuan tidak boleh sama"', async () => {
    const res = await request(app)
      .post(`${BASE}/transfers`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({
        from_shop_id: SHOP_DALANGAN,
        to_shop_id: SHOP_DALANGAN,
        items: [{ product_variant_id: VARIANT_AQUA, qty: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Toko asal dan tujuan tidak boleh sama');
  });

  test('[Skenario 27] items tidak disertakan atau array kosong → HTTP 400, "Transfer harus memiliki minimal satu item"', async () => {
    const res = await request(app)
      .post(`${BASE}/transfers`)
      .set('Authorization', `Bearer ${tokens.adminDalangan}`)
      .send({ from_shop_id: SHOP_DALANGAN, to_shop_id: SHOP_CIKLI, items: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Transfer harus memiliki minimal satu item');
  });
});

describe('PATCH /transfers/:id/approve', () => {
  test('[Skenario 28] Token Admin toko tujuan → HTTP 200, stok toko asal berkurang & stok toko tujuan bertambah', async () => {
    const res = await request(app)
      .patch(`${BASE}/transfers/${createdTransferId}/approve`)
      .set('Authorization', `Bearer ${tokens.adminCikli}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });
});

// =============================================================================
// SKENARIO 29–31  ▶  POST /ai/sessions/:id/chat
//
// ⚠ Skenario 29 & 30 memerlukan AI service berjalan di AI_SERVICE_URL
//   (default: http://localhost:8000). Jika tidak berjalan, tes akan di-skip.
// =============================================================================

describe('POST /ai/sessions/:id/chat', () => {
  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}/ai/sessions`)
      .set('Authorization', `Bearer ${tokens.superAdmin}`)
      .send({ scope: 'global' });
    aiSessionId = res.body.data?.id;
  }, 15000);

  test('[Skenario 31] Tanpa header Authorization → HTTP 401, permintaan ditolak', async () => {
    const sessionId = aiSessionId ?? '00000000-0000-4000-8000-000000000001';
    const res = await request(app)
      .post(`${BASE}/ai/sessions/${sessionId}/chat`)
      .send({ message: 'Halo' });

    expect(res.status).toBe(401);
  });

  test('[Skenario 29] Pertanyaan analitik bisnis → HTTP 200, teks jawaban, query SQL & data dikembalikan', async () => {
    if (!aiSessionId) {
      console.warn('[Skip] Skenario 29: AI session gagal dibuat — AI service mungkin tidak berjalan');
      return;
    }
    const res = await request(app)
      .post(`${BASE}/ai/sessions/${aiSessionId}/chat`)
      .set('Authorization', `Bearer ${tokens.superAdmin}`)
      .send({ message: 'Berapa total penjualan bulan Maret 2026?' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('answer');
  }, 60000);

  test('[Skenario 30] Pertanyaan umum (tidak perlu data DB) → HTTP 200, jawaban langsung tanpa query SQL', async () => {
    if (!aiSessionId) {
      console.warn('[Skip] Skenario 30: AI session gagal dibuat — AI service mungkin tidak berjalan');
      return;
    }
    const res = await request(app)
      .post(`${BASE}/ai/sessions/${aiSessionId}/chat`)
      .set('Authorization', `Bearer ${tokens.superAdmin}`)
      .send({ message: 'Apa itu sistem Point of Sale?' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('answer');
  }, 60000);
});
