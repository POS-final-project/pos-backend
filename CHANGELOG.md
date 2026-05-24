# POS Backend — Dokumentasi Perubahan

> **Tanggal:** 19 April 2026  
> **Scope:** Implementasi API inti (auth, profile, shops, categories, products, inventory, transfers, customers)

---

## Daftar Isi

1. [Dependencies Baru](#1-dependencies-baru)
2. [Migrasi Database](#2-migrasi-database)
3. [Model yang Diubah](#3-model-yang-diubah)
4. [File Baru — Utils](#4-file-baru--utils)
5. [File Baru — Middlewares](#5-file-baru--middlewares)
6. [File Baru — Services](#6-file-baru--services)
7. [File Baru — Controllers](#7-file-baru--controllers)
8. [File Baru — Routes](#8-file-baru--routes)
9. [File yang Diubah](#9-file-yang-diubah)
10. [Variabel Environment yang Dibutuhkan](#10-variabel-environment-yang-dibutuhkan)
11. [Langkah Setup](#11-langkah-setup)
12. [Daftar Endpoint](#12-daftar-endpoint)
13. [Catatan Bisnis Logic](#13-catatan-bisnis-logic)

---

## 1. Dependencies Baru

```bash
npm install multer nodemailer express-validator
```

| Package             | Versi | Kegunaan                                         |
| ------------------- | ----- | ------------------------------------------------ |
| `multer`            | ^2.x  | Upload file foto profil                          |
| `nodemailer`        | ^6.x  | Kirim email reset password                       |
| `express-validator` | ^7.x  | Installed (siap dipakai untuk validasi lanjutan) |

---

## 2. Migrasi Database

### `20260419000001-add-phone-imageurl-to-users.js`

Menambahkan dua kolom baru ke tabel `users`:

| Kolom       | Tipe    | Nullable |
| ----------- | ------- | -------- |
| `phone`     | VARCHAR | ✅       |
| `image_url` | VARCHAR | ✅       |

**Cara jalankan:**

```bash
npx sequelize-cli db:migrate
```

**Cara rollback:**

```bash
npx sequelize-cli db:migrate:undo
```

---

## 3. Model yang Diubah

### `src/models/User.js`

Ditambahkan dua field baru agar sinkron dengan migrasi:

```js
// Tambahan di User.init(...)
phone: {
  type: DataTypes.STRING,
  allowNull: true,
},
image_url: {
  type: DataTypes.STRING,
  allowNull: true,
},
```

---

## 4. File Baru — Utils

### `src/utils/jwt.js`

Helper untuk generate dan verifikasi JWT.

| Fungsi                 | Deskripsi                                                      |
| ---------------------- | -------------------------------------------------------------- |
| `signAccess(payload)`  | Generate access token (default 15 menit, via `JWT_EXPIRES_IN`) |
| `signRefresh(payload)` | Generate refresh token (7 hari)                                |
| `signReset(payload)`   | Generate token reset password (15 menit)                       |
| `verifyAccess(token)`  | Verifikasi access/reset token                                  |
| `verifyRefresh(token)` | Verifikasi refresh token                                       |

---

### `src/utils/response.js`

Standarisasi format response JSON seluruh API.

| Fungsi                                    | Status Code Default | Deskripsi                       |
| ----------------------------------------- | ------------------- | ------------------------------- |
| `success(res, data, message, statusCode)` | 200                 | Response sukses                 |
| `paginated(res, data, meta, message)`     | 200                 | Response list dengan pagination |
| `error(res, message, statusCode, errors)` | 500                 | Response error                  |

**Format sukses:**

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Format paginated:**

```json
{
  "success": true,
  "message": "...",
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Format error:**

```json
{
  "success": false,
  "message": "...",
  "errors": [ ... ]
}
```

---

### `src/utils/pagination.js`

Helper untuk kalkulasi pagination dari query string.

| Fungsi                        | Deskripsi                                                           |
| ----------------------------- | ------------------------------------------------------------------- |
| `getPagination(query)`        | Parse `page` & `limit` dari query, return `{ page, limit, offset }` |
| `getMeta(total, page, limit)` | Buat objek meta pagination                                          |

- Default `limit`: 20
- Maksimum `limit`: 100

---

## 5. File Baru — Middlewares

### `src/middlewares/auth.js`

Verifikasi JWT dari header `Authorization: Bearer <token>`. Menyimpan payload ke `req.user`.

**Error response:**

- `401 Unauthorized` — header tidak ada atau tidak diawali `Bearer`
- `401 Token invalid atau expired` — JWT gagal diverifikasi

---

### `src/middlewares/authorize.js`

Role-based access control. Digunakan setelah `auth` middleware.

**Cara pakai:**

```js
router.post("/endpoint", auth, authorize("superAdmin", "admin"), controller);
```

**Error response:**

- `403 Forbidden: insufficient role`

---

### `src/middlewares/shopAccess.js`

Resolusi `req.shopId` untuk endpoint dengan scope `shop_or_global`. Memvalidasi kepemilikan toko via tabel `user_shops`.

| Role             | Behaviour                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| `superAdmin`     | `req.shopId` = `query.shopId` atau `null` (semua toko)                                                                |
| `admin` / `user` | Wajib punya assignment di `user_shops`. Jika punya >1 toko, harus sertakan `?shopId=`. Jika hanya 1 toko, auto-infer. |

**Error response:**

- `400` — memiliki >1 toko tapi tidak sertakan shopId
- `403` — shopId bukan milik user
- `403` — belum ditugaskan ke toko manapun

---

### `src/middlewares/upload.js`

Konfigurasi Multer untuk upload foto profil.

| Setting              | Nilai                                   |
| -------------------- | --------------------------------------- |
| Destination          | `uploads/`                              |
| Nama file            | Random hex (12 bytes) + ekstensi asli   |
| Format yang diterima | `image/jpeg`, `image/png`, `image/webp` |
| Ukuran maksimum      | 2 MB                                    |

---

## 6. File Baru — Services

### `src/services/email.service.js`

Kirim email via SMTP (nodemailer).

| Fungsi                             | Deskripsi                              |
| ---------------------------------- | -------------------------------------- |
| `sendResetPassword(to, resetLink)` | Kirim email berisi link reset password |

Konfigurasi SMTP dari environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`.

---

### `src/services/auth.service.js`

| Fungsi                                                       | Deskripsi                                                                     |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `login({ email, password })`                                 | Validasi credentials, return access + refresh token                           |
| `refresh(refreshToken)`                                      | Verifikasi refresh token JWT, return access token baru                        |
| `registerAdmin({ name, email, password, shopId })`           | Buat user role `admin`, assign ke toko                                        |
| `registerUser({ name, email, password, shopId }, requester)` | Buat user role `user`. Admin hanya bisa daftarkan ke toko miliknya            |
| `forgotPassword(email)`                                      | Generate JWT reset (15 menit), kirim email. Silent jika email tidak ditemukan |
| `resetPassword(token, newPassword)`                          | Verifikasi token tujuan `reset`, update password                              |
| `changePassword(userId, { currentPassword, newPassword })`   | Validasi password lama, update ke yang baru                                   |

---

### `src/services/profile.service.js`

| Fungsi                                     | Deskripsi                                            |
| ------------------------------------------ | ---------------------------------------------------- |
| `getMe(userId)`                            | Ambil data user tanpa field password                 |
| `updateMe(userId, { name, email, phone })` | Update profil. Cek duplikasi email jika diubah       |
| `updatePhoto(userId, filename)`            | Update `image_url` dengan path `/uploads/<filename>` |

---

### `src/services/shop.service.js`

| Fungsi                                                        | Deskripsi                                          |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `list(query, requesterId, requesterRole)`                     | SuperAdmin: semua toko. Admin: hanya toko miliknya |
| `create({ name, address, phone })`                            | Buat toko baru (superAdmin only)                   |
| `detail(shopId, requesterId, requesterRole)`                  | Detail toko. Admin divalidasi kepemilikan          |
| `update(shopId, requesterId, requesterRole, body)`            | Admin hanya bisa update toko sendiri               |
| `remove(shopId)`                                              | Soft delete (`is_active = false`)                  |
| `assignStaff(shopId, requesterId, requesterRole, { userId })` | Tambah user ke toko                                |
| `removeStaff(shopId, requesterId, requesterRole, userId)`     | Hapus user dari toko                               |
| `listStaff(shopId, requesterId, requesterRole)`               | Daftar staff di toko                               |

---

### `src/services/category.service.js`

| Fungsi                         | Deskripsi                             |
| ------------------------------ | ------------------------------------- |
| `list(query)`                  | List semua kategori dengan pagination |
| `create({ name })`             | Buat kategori, cek duplikasi nama     |
| `update(categoryId, { name })` | Update nama, cek duplikasi            |
| `remove(categoryId)`           | Hard delete                           |

---

### `src/services/product.service.js`

**Products:**

| Fungsi                       | Deskripsi                                                    |
| ---------------------------- | ------------------------------------------------------------ |
| `list(query)`                | List produk dengan filter `search`, `categoryId`, `isActive` |
| `create({ name, sku, ... })` | Buat produk, cek duplikasi SKU                               |
| `detail(productId)`          | Detail produk beserta variants dan kategori                  |
| `update(productId, body)`    | Update produk, cek duplikasi SKU                             |
| `remove(productId)`          | Soft delete (`is_active = false`)                            |

**Variants:**

| Fungsi                                           | Deskripsi                                    |
| ------------------------------------------------ | -------------------------------------------- |
| `listVariants(productId, query)`                 | List variants produk                         |
| `createVariant(productId, { name, sku, price })` | Tambah variant, cek duplikasi SKU            |
| `detailVariant(productId, variantId)`            | Detail variant                               |
| `updateVariant(productId, variantId, body)`      | Update variant termasuk harga                |
| `deleteVariant(productId, variantId)`            | **Hard delete. Ditolak jika masih ada stok** |

---

### `src/services/inventory.service.js`

| Fungsi                                                                           | Deskripsi                                                                                           |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `list(query, shopId)`                                                            | List inventory, difilter shopId                                                                     |
| `byProduct(productId, query, shopId)`                                            | Inventory berdasarkan produk                                                                        |
| `restock({ shop_id, product_variant_id, qty, cost_price, note }, userId)`        | Tambah stok. Hitung ulang `avg_cost_price` (weighted average). Buat `stock_movement` type `restock` |
| `adjustOut({ shop_id, product_variant_id, qty, note }, userId)`                  | Kurangi stok manual. Buat `stock_movement` type `adjustment_out`                                    |
| `setThreshold(inventoryId, { low_stock_threshold }, requesterId, requesterRole)` | Update threshold low stock alert                                                                    |
| `movementHistory(query, shopId)`                                                 | Riwayat pergerakan stok, difilter shopId dan type                                                   |

**Formula avg_cost_price saat restock:**

```
new_avg = (current_stock × current_avg + qty × cost_price) / (current_stock + qty)
```

---

### `src/services/transfer.service.js`

| Fungsi                                                                | Deskripsi                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `create({ from_shop_id, to_shop_id, note, items }, userId, userRole)` | Buat transfer request. Admin hanya bisa dari tokonya sendiri                    |
| `listOutgoing(query, shopId, userId, userRole)`                       | Transfer keluar. SuperAdmin bisa lihat semua                                    |
| `listIncoming(query, shopId, userId, userRole)`                       | Transfer masuk. SuperAdmin bisa lihat semua                                     |
| `detail(transferId, userId, userRole)`                                | Detail transfer. Divalidasi akses ke from/to shop                               |
| `items(transferId, userId, userRole)`                                 | List item transfer                                                              |
| `approve(transferId, userId)`                                         | **Hanya admin toko tujuan.** Otomatis memindahkan stok + buat 2 stock_movements |
| `reject(transferId, userId)`                                          | Hanya admin toko tujuan, status harus `pending`                                 |
| `cancel(transferId, userId)`                                          | Hanya admin toko pengirim, status harus `pending`                               |

**Alur approve transfer:**

1. Validasi approver adalah admin `to_shop`
2. Untuk setiap item:
   - Cek stok `from_shop` mencukupi
   - Kurangi stok `from_shop` → buat `StockMovement` type `transfer_out`
   - Tambah stok `to_shop` (find-or-create) → buat `StockMovement` type `transfer_in`
   - Hitung ulang `avg_cost_price` di `to_shop`
3. Update status transfer → `approved`

> Seluruh operasi approve dijalankan dalam satu **database transaction** (rollback otomatis jika ada kegagalan).

---

### `src/services/customer.service.js`

| Fungsi                                    | Deskripsi                                                   |
| ----------------------------------------- | ----------------------------------------------------------- |
| `list(query)`                             | List customer dengan filter `search` (nama, telepon, email) |
| `create({ name, phone, email, address })` | Buat customer, cek duplikasi phone dan email                |
| `detail(customerId)`                      | Detail customer                                             |
| `update(customerId, body)`                | Update customer, cek duplikasi phone/email                  |
| `remove(customerId)`                      | Hard delete                                                 |
| `transactions(customerId, query)`         | Riwayat transaksi customer                                  |

---

## 7. File Baru — Controllers

Semua controller mengikuti pola yang seragam:

```js
exports.action = async (req, res) => {
  try {
    const data = await service.action(params);
    return success(res, data, "Pesan");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
```

| File                                      | Menangani                                                          |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `src/controllers/auth.controller.js`      | login, refresh, logout, register, forgot/reset/change password     |
| `src/controllers/profile.controller.js`   | getMe, updateMe, updatePhoto                                       |
| `src/controllers/shop.controller.js`      | CRUD toko + staff management                                       |
| `src/controllers/category.controller.js`  | CRUD kategori                                                      |
| `src/controllers/product.controller.js`   | CRUD produk + CRUD variants                                        |
| `src/controllers/inventory.controller.js` | list, byProduct, restock, adjustOut, setThreshold, movementHistory |
| `src/controllers/transfer.controller.js`  | create, list, detail, items, approve, reject, cancel               |
| `src/controllers/customer.controller.js`  | CRUD customer + riwayat transaksi                                  |

---

## 8. File Baru — Routes

### `src/routes/index.js`

Router utama yang menggabungkan semua sub-router ke prefix `/api`:

```
/api/auth        → auth.routes.js
/api/profile     → profile.routes.js
/api/shops       → shop.routes.js
/api/categories  → category.routes.js
/api/products    → product.routes.js
/api/inventory   → inventory.routes.js
/api/transfers   → transfer.routes.js
/api/customers   → customer.routes.js
```

---

## 9. File yang Diubah

### `src/app.js`

| Perubahan                  | Detail                                             |
| -------------------------- | -------------------------------------------------- |
| Tambah static file serving | `GET /uploads/*` melayani file yang diupload       |
| Wire API routes            | `app.use('/api', require('./routes'))`             |
| Update 404 response        | Sesuai format `{ success: false, message: '...' }` |
| Update error handler       | Sesuai format `{ success: false, message: '...' }` |

---

## 10. Variabel Environment yang Dibutuhkan

Tambahkan ke file `.env`:

```env
# JWT
JWT_SECRET=ganti_dengan_secret_kuat
JWT_REFRESH_SECRET=ganti_dengan_refresh_secret_kuat
JWT_EXPIRES_IN=15m

# Frontend URL (untuk link reset password di email)
FRONTEND_URL=http://localhost:3001

# SMTP (nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email@gmail.com
SMTP_PASS=app_password_gmail
SMTP_FROM="POS System <no-reply@pos.com>"
```

---

## 11. Langkah Setup

```bash
# 1. Install dependencies baru
npm install

# 2. Jalankan migrasi (tambah kolom phone & image_url ke tabel users)
npx sequelize-cli db:migrate

# 3. Jalankan server
npm run dev
```

---

## 12. Daftar Endpoint

### Auth — `POST /api/auth/...`

| Method | Path                        | Role              | Deskripsi                |
| ------ | --------------------------- | ----------------- | ------------------------ |
| POST   | `/api/auth/login`           | Public            | Login                    |
| POST   | `/api/auth/refresh`         | Public            | Refresh access token     |
| POST   | `/api/auth/logout`          | All               | Logout                   |
| POST   | `/api/auth/register/admin`  | superAdmin        | Daftarkan admin baru     |
| POST   | `/api/auth/register/user`   | superAdmin, admin | Daftarkan user baru      |
| POST   | `/api/auth/forgot-password` | Public            | Request reset password   |
| POST   | `/api/auth/reset-password`  | Public            | Reset password via token |
| POST   | `/api/auth/change-password` | All               | Ganti password           |

### Profile — `/api/profile`

| Method | Path                 | Role | Deskripsi                                                |
| ------ | -------------------- | ---- | -------------------------------------------------------- |
| GET    | `/api/profile`       | All  | Ambil profil sendiri                                     |
| PATCH  | `/api/profile`       | All  | Update nama, email, telepon                              |
| PATCH  | `/api/profile/photo` | All  | Upload foto profil (multipart/form-data, field: `photo`) |

### Shops — `/api/shops`

| Method | Path                               | Role              | Deskripsi             |
| ------ | ---------------------------------- | ----------------- | --------------------- |
| GET    | `/api/shops`                       | superAdmin, admin | List toko             |
| POST   | `/api/shops`                       | superAdmin        | Buat toko             |
| GET    | `/api/shops/:shopId`               | superAdmin, admin | Detail toko           |
| PATCH  | `/api/shops/:shopId`               | superAdmin, admin | Update toko           |
| DELETE | `/api/shops/:shopId`               | superAdmin        | Hapus toko (soft)     |
| GET    | `/api/shops/:shopId/staff`         | superAdmin, admin | List staff toko       |
| POST   | `/api/shops/:shopId/staff`         | superAdmin, admin | Assign staff ke toko  |
| DELETE | `/api/shops/:shopId/staff/:userId` | superAdmin, admin | Hapus staff dari toko |

### Categories — `/api/categories`

| Method | Path                          | Role       | Deskripsi       |
| ------ | ----------------------------- | ---------- | --------------- |
| GET    | `/api/categories`             | All        | List kategori   |
| POST   | `/api/categories`             | superAdmin | Buat kategori   |
| PATCH  | `/api/categories/:categoryId` | superAdmin | Update kategori |
| DELETE | `/api/categories/:categoryId` | superAdmin | Hapus kategori  |

### Products & Variants — `/api/products`

| Method | Path                                           | Role              | Deskripsi                                                |
| ------ | ---------------------------------------------- | ----------------- | -------------------------------------------------------- |
| GET    | `/api/products`                                | All               | List produk (filter: `search`, `categoryId`, `isActive`) |
| POST   | `/api/products`                                | superAdmin, admin | Buat produk                                              |
| GET    | `/api/products/:productId`                     | All               | Detail produk + variants                                 |
| PATCH  | `/api/products/:productId`                     | superAdmin, admin | Update produk                                            |
| DELETE | `/api/products/:productId`                     | superAdmin, admin | Hapus produk (soft)                                      |
| GET    | `/api/products/:productId/variants`            | All               | List variants                                            |
| POST   | `/api/products/:productId/variants`            | superAdmin, admin | Tambah variant                                           |
| GET    | `/api/products/:productId/variants/:variantId` | All               | Detail variant                                           |
| PATCH  | `/api/products/:productId/variants/:variantId` | superAdmin, admin | Update variant (termasuk harga)                          |
| DELETE | `/api/products/:productId/variants/:variantId` | superAdmin, admin | Hapus variant (ditolak jika ada stok)                    |

### Inventory — `/api/inventory`

| Method | Path                                    | Role              | Deskripsi                                      |
| ------ | --------------------------------------- | ----------------- | ---------------------------------------------- |
| GET    | `/api/inventory`                        | superAdmin, admin | List inventory (`?shopId=`)                    |
| GET    | `/api/inventory/movements`              | superAdmin, admin | Riwayat pergerakan stok (`?shopId=`, `?type=`) |
| GET    | `/api/inventory/products/:productId`    | superAdmin, admin | Stok berdasarkan produk (`?shopId=`)           |
| POST   | `/api/inventory/restock`                | superAdmin, admin | Tambah stok masuk                              |
| POST   | `/api/inventory/adjustment-out`         | superAdmin, admin | Adjustment stok keluar                         |
| PATCH  | `/api/inventory/:inventoryId/threshold` | superAdmin, admin | Set threshold low stock                        |

**Body restock:**

```json
{
  "shop_id": "uuid",
  "product_variant_id": "uuid",
  "qty": 10,
  "cost_price": 5000,
  "note": "opsional"
}
```

### Transfers — `/api/transfers`

| Method | Path                                 | Role              | Deskripsi                                                     |
| ------ | ------------------------------------ | ----------------- | ------------------------------------------------------------- |
| POST   | `/api/transfers`                     | superAdmin, admin | Buat transfer request                                         |
| GET    | `/api/transfers/outgoing`            | superAdmin, admin | List transfer keluar (`?shopId=`, `?status=`)                 |
| GET    | `/api/transfers/incoming`            | superAdmin, admin | List transfer masuk (`?shopId=`, `?status=`)                  |
| GET    | `/api/transfers/:transferId`         | superAdmin, admin | Detail transfer                                               |
| GET    | `/api/transfers/:transferId/items`   | superAdmin, admin | Item-item transfer                                            |
| PATCH  | `/api/transfers/:transferId/approve` | admin             | Setujui transfer (hanya admin toko tujuan)                    |
| PATCH  | `/api/transfers/:transferId/reject`  | admin             | Tolak transfer (hanya admin toko tujuan)                      |
| PATCH  | `/api/transfers/:transferId/cancel`  | admin             | Batalkan transfer (hanya admin toko pengirim, status pending) |

**Body create transfer:**

```json
{
  "from_shop_id": "uuid",
  "to_shop_id": "uuid",
  "note": "opsional",
  "items": [{ "product_variant_id": "uuid", "qty": 5, "note": "opsional" }]
}
```

### Customers — `/api/customers`

| Method | Path                                      | Role              | Deskripsi                          |
| ------ | ----------------------------------------- | ----------------- | ---------------------------------- |
| GET    | `/api/customers`                          | superAdmin, admin | List customer (filter: `?search=`) |
| POST   | `/api/customers`                          | superAdmin, admin | Buat customer                      |
| GET    | `/api/customers/:customerId`              | superAdmin, admin | Detail customer                    |
| PATCH  | `/api/customers/:customerId`              | superAdmin, admin | Update customer                    |
| DELETE | `/api/customers/:customerId`              | superAdmin, admin | Hapus customer                     |
| GET    | `/api/customers/:customerId/transactions` | superAdmin, admin | Riwayat transaksi customer         |

---

## 13. Catatan Bisnis Logic

### Token Strategy

- **Access token:** JWT, 15 menit, payload `{ id, role }`
- **Refresh token:** JWT, 7 hari, payload `{ id, role, type: 'refresh' }` — stateless, tidak disimpan di DB
- **Reset token:** JWT 15 menit dengan payload `{ id, purpose: 'reset' }` — menggunakan `JWT_SECRET` yang sama dengan access token

### Keamanan Forgot Password

Response selalu `200 OK` meski email tidak ditemukan (mencegah user enumeration attack).

### Stock Movement Types

| Type             | Pemicu                                             |
| ---------------- | -------------------------------------------------- |
| `restock`        | `POST /api/inventory/restock`                      |
| `adjustment_out` | `POST /api/inventory/adjustment-out`               |
| `transfer_out`   | Transfer disetujui (toko pengirim)                 |
| `transfer_in`    | Transfer disetujui (toko penerima)                 |
| `sale`           | _(Dipakai modul transaksi — belum diimplementasi)_ |
| `refund`         | _(Dipakai modul refund — belum diimplementasi)_    |

### Soft Delete vs Hard Delete

| Model          | Strategi                                      |
| -------------- | --------------------------------------------- |
| Shop           | Soft delete (`is_active = false`)             |
| Product        | Soft delete (`is_active = false`)             |
| ProductVariant | Hard delete — **ditolak jika masih ada stok** |
| Category       | Hard delete                                   |
| Customer       | Hard delete                                   |

### Pagination Query Params

Semua endpoint list mendukung:

- `?page=1` — nomor halaman (default: 1)
- `?limit=20` — jumlah per halaman (default: 20, maks: 100)
