# Memory — Konteks TA: Text-to-SQL untuk Backend POS

Dokumen ini merangkum konteks lengkap proyek TA, pipeline evaluasi yang telah dibangun,
dan schema database POS yang menjadi target pembuatan dataset sintetis SQL.

---

## 1. Gambaran Besar Proyek

Tujuan TA adalah membangun sistem **Natural Language to SQL (NL2SQL)** yang diintegrasikan
ke dalam aplikasi **Point-of-Sale (POS)**. Pengguna (kasir/admin) bisa mengajukan pertanyaan
dalam bahasa alami, sistem menerjemahkannya menjadi SQL, mengeksekusi ke PostgreSQL, dan
mengembalikan hasilnya.

**Model yang digunakan:** Qwen2.5-Coder-7B-Instruct (4-bit NF4 quantization, Hugging Face)

---

## 2. Pipeline Evaluasi yang Sudah Dibangun

Dua pipeline evaluasi sudah dibuat sebagai notebook Google Colab (T4 GPU):

### 2a. Spider Dev Evaluation (`engine_evaluation/bird_eval_spider_colab.ipynb`)

Digunakan untuk **benchmarking dengan dataset publik** sebelum ke domain POS.

**Versi yang sudah dijalankan:**

| Versi | EX | EM | Teknik |
|-------|----|----|--------|
| v1 (baseline) | 80.1% | 59.9% | Zero-shot + Step 1 rules |
| v2 | 78.4% | 63.3% | + TF-IDF few-shot (EX turun karena cross-DB contamination) |
| v3 | 78.4% | 63.3% | + Option B warning (tidak efektif) |
| **v4 (terbaru)** | *belum dijalankan* | *belum dijalankan* | + FK hints + self-consistency k=3 |

**Target v4:** EX ≥ 85%, EM > 63.3%

**Teknik di v4:**
- **Foreign Key hints**: relasi FK dari `tables.json` ditambahkan ke schema prompt
  ```
  -- Foreign Key References:
  -- orders.customer_id -> customers.id
  ```
- **Self-consistency k=3**: generate 1 greedy (T=0) + 2 sampled (T=0.8), pilih SQL
  yang menghasilkan result set mayoritas saat dieksekusi
- **Step 1 rules**: instruksi eksplisit di SYSTEM_PROMPT untuk pola UNION, INTERSECT,
  NOT IN, HAVING, STRFTIME (SQLite dialect)

**Metrik:**
- **EX (Execution Accuracy)**: eksekusi SQL, bandingkan result set (`set(pred) == set(gold)`)
- **EM (Exact Set Match)**: evaluasi resmi Spider, component-level match via `evaluation.py`
- **Soft-F1**: partial match row-by-row

**Checkpoint/resume:** setiap 50 sample, atomic write via `.tmp` file.

### 2b. BIRD Full Dev (`engine_evaluation/bird_eval_dev_colab.ipynb`)

Dataset BIRD (1534 samples, 11 DB), dijalankan sebagai eksperimen awal.
Hasilnya kurang memuaskan — Spider menjadi fokus utama.

---

## 3. Schema Database POS Backend

Database: **PostgreSQL**
ORM: **Sequelize** (Node.js)
Semua primary key: **UUID** (`gen_random_uuid()`)
Timestamps: `created_at`, `updated_at` (kecuali tabel yang disebutkan)

### Tabel dan Kolom

#### `shops` — Toko/cabang
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| name | STRING | Nama toko |
| address | TEXT | nullable |
| phone | STRING | nullable |
| is_active | BOOLEAN | default true |

#### `users` — Pengguna sistem
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| name | STRING | |
| email | STRING UNIQUE | |
| password | STRING | hashed |
| role | ENUM | `superAdmin` \| `admin` \| `user` |
| is_active | BOOLEAN | default true |

#### `user_shops` — Many-to-many: user ↔ toko
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| user_id | UUID PK FK→users | |
| shop_id | UUID PK FK→shops | |

#### `categories` — Kategori produk
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| name | STRING | |

#### `customers` — Pelanggan
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| name | STRING | |
| phone | STRING | nullable |
| email | STRING | nullable |
| address | TEXT | nullable |

#### `products` — Produk
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| category_id | UUID FK→categories | nullable, SET NULL on delete |
| name | STRING | |
| sku | STRING UNIQUE | kode produk |
| description | TEXT | nullable |
| image_url | STRING | nullable |
| is_active | BOOLEAN | default true |

> Catatan: `sku` di level produk dihapus di migration `20260427000002` — gunakan SKU di `product_variants`.

#### `product_variants` — Varian produk (ukuran, warna, dll.)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| product_id | UUID FK→products | CASCADE delete |
| name | STRING | nama varian, misal "500ml", "Merah-L" |
| sku | STRING UNIQUE | kode unik varian |
| price | DECIMAL(15,2) | harga jual, CHECK >= 0 |
| is_active | BOOLEAN | default true |
| image_url | STRING | nullable (dipindah dari products) |

#### `inventory` — Stok per toko per varian
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| shop_id | UUID FK→shops | |
| product_variant_id | UUID FK→product_variants | |
| stock | INTEGER | stok fisik, CHECK >= 0 |
| reserved_stock | INTEGER | stok ter-reserve (dalam proses transfer keluar), CHECK >= 0 |
| avg_cost_price | DECIMAL(15,2) | rata-rata harga beli (FIFO/weighted avg) |
| low_stock_threshold | INTEGER | batas stok rendah, default 5 |
| updated_at | DATE | |

**Unique constraint:** `(shop_id, product_variant_id)` — satu varian hanya punya satu baris inventory per toko.

**Stok tersedia = `stock - reserved_stock`**

#### `transactions` — Header transaksi penjualan
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| shop_id | UUID FK→shops | |
| user_id | UUID FK→users | kasir yang melakukan transaksi |
| customer_id | UUID FK→customers | nullable (transaksi tanpa pelanggan) |
| invoice_no | STRING UNIQUE | nomor invoice |
| status | STRING | `pending` \| `completed` \| `cancelled` |
| payment_method | STRING | `cash` \| `transfer` \| `qris` \| `credit` |
| paid_at | DATE | nullable; NOT NULL jika status=completed |
| subtotal | DECIMAL(15,2) | total sebelum diskon/pajak |
| note | TEXT | nullable |

**Check constraint:** jika `status = 'completed'` maka `paid_at IS NOT NULL`

#### `transaction_items` — Detail item per transaksi
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| transaction_id | UUID FK→transactions | CASCADE delete |
| product_variant_id | UUID FK→product_variants | |
| qty | INTEGER | |
| price | DECIMAL(15,2) | snapshot harga jual saat transaksi |
| cost_price | DECIMAL(15,2) | snapshot avg_cost_price inventory saat transaksi |
| subtotal | DECIMAL(15,2) | price × qty |

#### `stock_movements` — Log pergerakan stok (audit trail)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| shop_id | UUID FK→shops | |
| user_id | UUID FK→users | |
| product_variant_id | UUID FK→product_variants | |
| transaction_id | UUID FK→transactions | nullable; diisi jika type=sale/refund |
| transfer_id | UUID FK→transfers | nullable; diisi jika type=transfer_in/transfer_out |
| type | STRING | `sale` \| `restock` \| `transfer_in` \| `transfer_out` \| `adjustment` \| `refund` |
| qty | INTEGER | positif=masuk, negatif=keluar |
| cost_price | DECIMAL(15,2) | nullable; diisi saat type=restock |
| stock_before | INTEGER | stok sebelum movement |
| stock_after | INTEGER | stok sesudah movement |
| avg_cost_before | DECIMAL(15,2) | |
| avg_cost_after | DECIMAL(15,2) | |
| note | TEXT | nullable |
| created_at | DATE | |

**Check constraint:** referensi harus konsisten dengan type:
- `sale` / `refund` → `transaction_id IS NOT NULL`
- `transfer_in` / `transfer_out` → `transfer_id IS NOT NULL`
- `restock` / `adjustment` → tidak perlu referensi

#### `transfers` — Transfer stok antar toko
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| from_shop_id | UUID FK→shops | toko asal |
| to_shop_id | UUID FK→shops | toko tujuan |
| requested_by | UUID FK→users | |
| confirmed_by | UUID FK→users | nullable; user yang approve/reject |
| status | STRING | `pending` \| `approved` \| `rejected` \| `cancelled` |
| confirmed_at | DATE | nullable |
| note | TEXT | nullable |

**Check constraints:**
- `from_shop_id != to_shop_id` (tidak boleh transfer ke toko sendiri)
- Konsistensi status: pending → `confirmed_at IS NULL`; approved/rejected → `confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL`

#### `transfer_items` — Detail item per transfer
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| transfer_id | UUID FK→transfers | CASCADE delete |
| product_variant_id | UUID FK→product_variants | |
| qty | INTEGER | CHECK > 0 |
| note | TEXT | nullable |

**Unique:** `(transfer_id, product_variant_id)`

#### `refunds` — Header refund
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| user_id | UUID FK→users | |
| transaction_id | UUID FK→transactions | transaksi asal yang di-refund |
| reason | TEXT | nullable |
| total_amount | DECIMAL(15,2) | |
| status | STRING | `pending` \| `approved` \| `rejected` |

#### `refund_items` — Detail item per refund
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | UUID PK | |
| refund_id | UUID FK→refunds | CASCADE delete |
| transaction_item_id | UUID FK→transaction_items | item transaksi yang dikembalikan |
| qty | INTEGER | CHECK > 0 |
| amount | DECIMAL(15,2) | nilai refund item ini |

---

## 4. Foreign Key Map (Relasi Antar Tabel)

```
shops ──────────────────────────────────┐
  │                                     │
  ├── user_shops.shop_id                │
  ├── inventory.shop_id                 │
  ├── transactions.shop_id              │
  ├── stock_movements.shop_id           │
  ├── transfers.from_shop_id            │
  └── transfers.to_shop_id             │
                                        │
users ──────────────────────────────────┤
  ├── user_shops.user_id               │
  ├── transactions.user_id             │
  ├── stock_movements.user_id          │
  ├── transfers.requested_by           │
  ├── transfers.confirmed_by           │
  └── refunds.user_id                  │
                                        │
categories                              │
  └── products.category_id             │
                                        │
products                                │
  └── product_variants.product_id      │
                                        │
product_variants                        │
  ├── inventory.product_variant_id     │
  ├── transaction_items.product_variant_id
  ├── stock_movements.product_variant_id
  └── transfer_items.product_variant_id

transactions
  ├── transaction_items.transaction_id
  ├── stock_movements.transaction_id
  └── refunds.transaction_id

refunds
  └── refund_items.refund_id

transaction_items
  └── refund_items.transaction_item_id

transfers
  ├── transfer_items.transfer_id
  └── stock_movements.transfer_id

customers
  └── transactions.customer_id
```

---

## 5. Panduan untuk Pembuatan Dataset SQL Sintetis

### 5a. Karakteristik Query yang Perlu Dicakup

Dataset sintetis harus mencakup spektrum kompleksitas berikut:

| Level | Karakteristik | Contoh Pertanyaan |
|-------|--------------|-------------------|
| **Simple** | SELECT 1 tabel, filter WHERE | "Tampilkan semua produk aktif" |
| **Medium** | JOIN 2-3 tabel, GROUP BY, agregasi | "Total penjualan per kategori bulan ini" |
| **Hard** | Subquery, HAVING, multiple JOIN | "Produk yang belum pernah terjual" |
| **Extra Hard** | Nested subquery, window function, multi-step | "Toko dengan pertumbuhan penjualan tertinggi bulan ke bulan" |

### 5b. Domain Query POS yang Relevan

1. **Penjualan & Pendapatan**
   - Total penjualan per toko/per hari/per bulan
   - Revenue per kasir
   - Metode pembayaran terpopuler
   - Transaksi pending yang belum diselesaikan

2. **Inventori & Stok**
   - Produk dengan stok di bawah threshold
   - Stok tersedia (`stock - reserved_stock`) per toko
   - Produk yang belum ada di inventory toko tertentu
   - Riwayat pergerakan stok suatu varian

3. **Produk & Kategori**
   - Produk terlaris (berdasarkan qty atau revenue)
   - Produk tidak aktif yang masih punya stok
   - Varian produk dengan harga tertinggi/terendah per kategori

4. **Transfer Antar Toko**
   - Transfer yang masih pending
   - Toko yang paling sering menerima/mengirim transfer
   - Item yang sedang dalam transfer (reserved)

5. **Refund**
   - Total nilai refund per transaksi
   - Produk yang paling sering di-refund
   - Refund pending yang belum diproses

6. **Pelanggan**
   - Pelanggan dengan total pembelian tertinggi
   - Pelanggan yang belum pernah bertransaksi
   - Transaksi tanpa pelanggan (walk-in)

7. **Audit & Riwayat**
   - Siapa yang melakukan restock terakhir untuk suatu produk
   - Semua adjustment stok dalam periode tertentu
   - Perubahan avg_cost_price suatu varian dari waktu ke waktu

### 5c. Edge Cases yang Harus Ada

| Kategori | Edge Case |
|----------|-----------|
| **NULL handling** | Customer nullable di transaksi; confirmed_by nullable di transfer pending |
| **Status filter** | Hanya transaksi `completed`; refund `approved`; transfer `pending` |
| **Stok tersedia** | Harus pakai `stock - reserved_stock`, bukan `stock` saja |
| **Self-join** | Transfer: `from_shop_id != to_shop_id` (dua FK ke tabel `shops`) |
| **Snapshot price** | `transaction_items.price` ≠ `product_variants.price` (harga bisa berubah) |
| **Partial refund** | Refund hanya sebagian item dari transaksi |
| **Multi-shop user** | Satu user bisa di banyak toko via `user_shops` |
| **Soft delete** | Filter `is_active = true` untuk products, users, shops |
| **Stok nol** | Produk ada di inventory tapi `stock = 0` |
| **Tanpa pelanggan** | `customer_id IS NULL` = transaksi walk-in |

### 5d. Format Anotasi QnA

Setiap sample dataset sintetis sebaiknya punya format:

```json
{
  "id": "pos_001",
  "db_id": "pos_backend",
  "question": "Tampilkan total penjualan per toko untuk bulan April 2026, hanya untuk transaksi yang sudah selesai",
  "query": "SELECT s.name, SUM(t.subtotal) AS total_penjualan FROM transactions t JOIN shops s ON t.shop_id = s.id WHERE t.status = 'completed' AND DATE_TRUNC('month', t.paid_at) = '2026-04-01' GROUP BY s.id, s.name ORDER BY total_penjualan DESC",
  "difficulty": "medium",
  "domain": "penjualan",
  "edge_cases": ["status_filter", "date_truncation", "nullable_paid_at"],
  "tables_used": ["transactions", "shops"],
  "notes": "paid_at dipakai (bukan created_at) karena yang relevan adalah waktu pembayaran terjadi"
}
```

### 5e. Hal yang Perlu Diperhatikan (PostgreSQL vs SQLite)

Pipeline evaluasi Spider menggunakan **SQLite**, tapi POS menggunakan **PostgreSQL**.
Perbedaan penting yang berpengaruh pada SQL yang dihasilkan:

| Aspek | SQLite | PostgreSQL |
|-------|--------|------------|
| Fungsi tanggal | `STRFTIME('%Y', col)` | `EXTRACT(YEAR FROM col)` / `DATE_TRUNC` |
| UUID | manual/string | `gen_random_uuid()` |
| Boolean | 0/1 | `TRUE` / `FALSE` |
| String concat | `\|\|` | `\|\|` atau `CONCAT()` |
| ILIKE | tidak ada | `ILIKE` (case-insensitive LIKE) |
| Subquery alias | wajib ada | wajib ada |

---

## 6. Struktur File Proyek

```
E:\Coding\TA\POS\
├── backend/                    ← Backend POS (Node.js + Sequelize + PostgreSQL)
│   ├── src/
│   │   ├── models/             ← Sequelize model definitions
│   │   ├── database/
│   │   │   ├── migrations/     ← Schema DDL (sumber kebenaran schema)
│   │   │   └── seeders/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   └── memory.md               ← file ini
│
└── LLM/                        ← Pipeline NL2SQL & evaluasi
    └── engine_evaluation/
        ├── bird_eval_spider_colab.ipynb   ← Notebook Spider dev (v4 terbaru)
        ├── bird_eval_dev_colab.ipynb      ← Notebook BIRD dev
        ├── llm/spider_data/               ← Spider dataset (lokal)
        ├── results_spider_colab/          ← Hasil v1: EX=80.1%, EM=59.9%
        ├── result_spider_v2_colab/        ← Hasil v2: EX=78.4%, EM=63.3%
        ├── result_spider_v3_colab/        ← Hasil v3: sama dengan v2
        └── results_spider_v4/             ← Target v4 (belum dijalankan)
```

---

## 7. Catatan Penting

- **Database POS** menggunakan UUID sebagai PK, bukan integer — query yang melibatkan filter ID harus pakai format UUID yang benar.
- **`inventory`** tidak punya `created_at` — hanya `updated_at`.
- **`stock_movements`** hanya punya `created_at` (immutable log), tidak ada `updated_at`.
- **`transaction_items`** tidak punya timestamps sama sekali.
- **`product_variants.price`** adalah harga jual saat ini; harga saat transaksi tersimpan di `transaction_items.price` (snapshot).
- **`avg_cost_price`** di `inventory` dihitung ulang setiap ada restock (weighted average method).
- Kolom `sku` di tabel `products` sudah **dihapus** (migration `20260427000002`); gunakan `sku` dari `product_variants`.
