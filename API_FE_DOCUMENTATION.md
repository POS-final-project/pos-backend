# API Documentation for Frontend

## 1) Ringkasan

- Base URL: /api
- Auth header (untuk endpoint protected): Authorization: Bearer <accessToken>
- Content-Type default: application/json
- Upload foto profile: multipart/form-data

## 2) Format Response Global

### Success (non paginated)

- success: true
- message: string
- data: object | array | null

### Success (paginated)

- success: true
- message: string
- data: array
- meta:
  - total: number
  - page: number
  - limit: number
  - totalPages: number

### Error

- success: false
- message: string
- errors: optional

## 3) Pagination dan Query Umum

- page: default 1
- limit: default 20, maksimum 100

## 4) Auth dan Role

- superAdmin: akses paling luas, tidak dibatasi kepemilikan toko
- admin: akses operasional (dibatasi toko tertentu pada endpoint tertentu)
- user (kasir): bisa membuat/melihat/membatalkan transaksi; membuat/mengedit/menghapus produk & variant; melihat stok dan riwayat pergerakan stok; melihat/membuat pelanggan; mengajukan refund; menyetujui transfer masuk ke tokonya

## 5) Shop Access Behavior (endpoint tertentu)

Untuk endpoint yang memakai mekanisme shop access:

- superAdmin:
  - boleh kirim query shopId untuk filter toko tertentu
  - jika shopId tidak dikirim, data lintas toko
- admin atau user:
  - jika kirim shopId, harus toko yang ditugaskan
  - jika tidak kirim shopId:
    - jika punya 1 toko, otomatis dipakai
    - jika punya >1 toko, akan error 400 dan wajib kirim shopId

## 6) API Detail per Modul

---

## A. Auth

### 1. POST /api/auth/login

- Auth: tidak perlu
- Body:
  - email: string, required
  - password: string, required
- Success 200 data:
  - accessToken: string
  - refreshToken: string
  - user:
    - id, name, email, role
- Error:
  - 400: email atau password kosong
  - 401: email/password salah

### 2. POST /api/auth/refresh

- Auth: tidak perlu
- Body:
  - refreshToken: string, required
- Success 200 data:
  - accessToken: string
- Error:
  - 400: refreshToken kosong
  - 401: refresh token invalid/expired

### 3. POST /api/auth/logout

- Auth: required
- Body: none
- Success 200 data: null

### 4. POST /api/auth/register/admin

- Auth: required
- Role: superAdmin
- Body:
  - name: string, required
  - email: string, required
  - password: string, required
  - shopId: uuid, required
- Success 201 data:
  - id, name, email, role
- Error:
  - 400: body required tidak lengkap
  - 404: shop tidak ditemukan
  - 409: email sudah dipakai

### 5. POST /api/auth/register/user

- Auth: required
- Role: superAdmin, admin
- Body:
  - name: string, required
  - email: string, required
  - password: string, required
  - shopId: uuid, required
- Success 201 data:
  - id, name, email, role
- Error:
  - 403: admin daftar user ke toko lain
  - 404: shop tidak ditemukan
  - 409: email sudah dipakai

### 6. POST /api/auth/forgot-password

- Auth: tidak perlu
- Body:
  - email: string, required
- Success 200 data: null
- Catatan:
  - tetap success walau email tidak terdaftar (security)

### 7. POST /api/auth/reset-password

- Auth: tidak perlu
- Body:
  - token: string, required
  - newPassword: string, required
- Success 200 data: null
- Error:
  - 400: token invalid/expired
  - 404: user tidak ditemukan

### 8. POST /api/auth/change-password

- Auth: required
- Body:
  - currentPassword: string, required
  - newPassword: string, required
- Success 200 data: null
- Error:
  - 400: password lama tidak sesuai
  - 404: user tidak ditemukan

---

## B. Profile

### 1. GET /api/profile

- Auth: required
- Body: none
- Success 200 data:
  - id, name, email, role, phone, image_url, is_active, created_at, updated_at

### 2. PATCH /api/profile

- Auth: required
- Body (opsional):
  - name: string
  - email: string
  - phone: string
- Success 200 data:
  - id, name, email, role, phone, image_url, is_active, created_at, updated_at
- Error:
  - 409: email sudah dipakai

### 3. PATCH /api/profile/photo

- Auth: required
- Content-Type: multipart/form-data
- Form field:
  - photo: file image (jpeg/png/webp), max 2MB, required
- Success 200 data:
  - image_url: string (format /uploads/<filename>)
- Error:
  - 400: file tidak dikirim

---

## C. Shops

### 1. GET /api/shops

- Auth: required
- Role: superAdmin, admin
- Query:
  - page, limit
- Success 200 paginated data item:
  - id, name, address, phone, is_active, created_at, updated_at

### 2. POST /api/shops

- Auth: required
- Role: superAdmin
- Body:
  - name: string, required
  - address: string, optional
  - phone: string, optional
- Success 201 data:
  - id, name, address, phone, is_active, created_at, updated_at

### 3. GET /api/shops/:shopId

- Auth: required
- Role: superAdmin, admin
- Success 200 data:
  - id, name, address, phone, is_active, created_at, updated_at
- Error:
  - 403: admin tidak punya akses toko
  - 404: toko tidak ditemukan

### 4. PATCH /api/shops/:shopId

- Auth: required
- Role: superAdmin, admin
- Body (opsional):
  - name, address, phone, is_active
- Success 200 data:
  - id, name, address, phone, is_active, created_at, updated_at

### 5. DELETE /api/shops/:shopId

- Auth: required
- Role: superAdmin
- Soft delete: set is_active false
- Success 200 data: null

### 6. GET /api/shops/:shopId/staff

- Auth: required
- Role: superAdmin, admin
- Success 200 data: array user
  - id, name, email, role, is_active, phone

### 7. POST /api/shops/:shopId/staff

- Auth: required
- Role: superAdmin, admin
- Body:
  - userId: uuid, required
- Success 201 data: null
- Error:
  - 404: user atau shop tidak ditemukan
  - 409: staff sudah ditugaskan

### 8. DELETE /api/shops/:shopId/staff/:userId

- Auth: required
- Role: superAdmin, admin
- Success 200 data: null

---

## D. Categories

### 1. GET /api/categories

- Auth: required
- Query:
  - page, limit
- Success 200 paginated data item:
  - id, name, created_at, updated_at

### 2. POST /api/categories

- Auth: required
- Role: superAdmin
- Body:
  - name: string, required
- Success 201 data:
  - id, name, created_at, updated_at
- Error:
  - 409: nama kategori sudah ada

### 3. PATCH /api/categories/:categoryId

- Auth: required
- Role: superAdmin
- Body:
  - name: string, required
- Success 200 data:
  - id, name, created_at, updated_at

### 4. DELETE /api/categories/:categoryId

- Auth: required
- Role: superAdmin
- Success 200 data: null

---

## E. Products

Catatan implementasi gambar:

- image_url disimpan di variant
- image_url pada response product adalah turunan dari variant pertama aktif setelah sorting by sku ascending

### 1. GET /api/products

- Auth: required
- Query:
  - page, limit
  - search: string (nama produk)
  - categoryId: uuid
  - isActive: true|false
- Success 200 paginated data item:
  - id, category_id, name, sku, description, is_active, created_at, updated_at
  - image_url (derived dari variant pertama aktif)
  - Category: { id, name }
  - variants: array variant aktif, urut sku ASC
    - id, product_id, name, sku, price, image_url, is_active, created_at, updated_at

### 2. POST /api/products

- Auth: required
- Role: superAdmin, admin, user
- Body:
  - name: string, required
  - sku: string, required (unik)
  - description: string, optional
  - category_id: uuid, optional
  - variants: array, required — minimal 1 item
    - name: string, required
    - sku: string, required (unik)
    - price: number, required
    - image_url: string, optional
- Catatan: product dan semua variant dibuat dalam satu transaksi atomik. Jika salah satu variant gagal, seluruh operasi dibatalkan.
- Success 201 data:
  - id, category_id, name, sku, description, is_active, created_at, updated_at
  - image_url (derived dari variant pertama aktif)
  - Category: { id, name }
  - variants: array variant yang baru dibuat
- Error:
  - 400: variants kosong atau field wajib variant tidak lengkap
  - 409: SKU produk atau SKU salah satu variant sudah digunakan

### 3. GET /api/products/:productId

- Auth: required
- Success 200 data:
  - field product
  - image_url (derived)
  - Category
  - variants (urut sku ASC)

### 4. PATCH /api/products/:productId

- Auth: required
- Role: superAdmin, admin, user
- Body (opsional):
  - name, sku, description, category_id, is_active
- Success 200 data:
  - product terbaru + image_url derived + variants urut sku ASC

### 5. DELETE /api/products/:productId

- Auth: required
- Role: superAdmin, admin, user
- Soft delete: set is_active false
- Success 200 data: null

---

## F. Product Variants (Nested)

### 1. GET /api/products/:productId/variants

- Auth: required
- Query:
  - page, limit
- Success 200 paginated data item (urut sku ASC):
  - id, product_id, name, sku, price, image_url, is_active, created_at, updated_at

### 2. POST /api/products/:productId/variants

- Auth: required
- Role: superAdmin, admin, user
- Body:
  - name: string, required
  - sku: string, required (unik global)
  - price: number, required
  - image_url: string, optional
- Success 201 data:
  - id, product_id, name, sku, price, image_url, is_active, created_at, updated_at

### 3. GET /api/products/:productId/variants/:variantId

- Auth: required
- Success 200 data:
  - id, product_id, name, sku, price, image_url, is_active, created_at, updated_at

### 4. PATCH /api/products/:productId/variants/:variantId

- Auth: required
- Role: superAdmin, admin, user
- Body (opsional):
  - name, sku, price, image_url, is_active
- Success 200 data:
  - id, product_id, name, sku, price, image_url, is_active, created_at, updated_at

### 5. DELETE /api/products/:productId/variants/:variantId

- Auth: required
- Role: superAdmin, admin, user
- Hard delete variant jika stok seluruh inventory = 0
- Success 200 data: null
- Error:
  - 400: variant masih punya stok

---

## G. Inventory

### 1. GET /api/inventory

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - page, limit
  - shopId: uuid (opsional, sesuai mekanisme shop access)
- Catatan: user (kasir) hanya bisa melihat stok toko tempat bertugas — shopAccess berlaku
- Success 200 paginated data item:
  - id, shop_id, product_variant_id, stock, avg_cost_price, low_stock_threshold, updated_at
  - ProductVariant:
    - id, name, sku, price, image_url, dll
    - Product: { id, name, sku }
  - Shop: { id, name }

### 2. GET /api/inventory/movements

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - page, limit
  - shopId: uuid (opsional)
  - type: sale | restock | transfer_in | transfer_out | adjustment | refund
- Catatan: user (kasir) hanya bisa melihat pergerakan stok toko tempat bertugas — shopAccess berlaku
- Success 200 paginated data item:
  - id, shop_id, user_id, product_variant_id, transaction_id, transfer_id
  - type, qty, cost_price, stock_before, stock_after, avg_cost_before, avg_cost_after, note, created_at
  - ProductVariant + Product
  - Shop

### 3. GET /api/inventory/products/:productId

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - page, limit
  - shopId: uuid (opsional)
- Success 200 paginated data item:
  - sama seperti GET /api/inventory
  - terfilter product tertentu

### 4. POST /api/inventory/restock

- Auth: required
- Role: superAdmin, admin
- Body:
  - shop_id: uuid, required
  - product_variant_id: uuid, required
  - qty: number > 0, required
  - cost_price: number, optional
  - note: string, optional
- Success 201 data:
  - inventory terbaru
- Error:
  - 403: admin tidak punya akses ke shop
  - 400: qty invalid

### 5. POST /api/inventory/adjustment-out

- Auth: required
- Role: superAdmin, admin
- Body:
  - shop_id: uuid, required
  - product_variant_id: uuid, required
  - qty: number > 0, required
  - note: string, optional
- Success 201 data:
  - inventory terbaru
- Error:
  - 400: stok tidak cukup
  - 404: inventory tidak ditemukan

### 6. PATCH /api/inventory/:inventoryId/threshold

- Auth: required
- Role: superAdmin, admin
- Body:
  - low_stock_threshold: number >= 0, required
- Success 200 data:
  - inventory terbaru

---

## H. Transfers

### 1. POST /api/transfers

- Auth: required
- Role: superAdmin, admin
- Body:
  - from_shop_id: uuid, required
  - to_shop_id: uuid, required
  - note: string, optional
  - items: array, required minimal 1 item
    - product_variant_id: uuid
    - qty: number
    - note: string, optional
- Success 201 data:
  - transfer object + items
- Error:
  - 400: from_shop_id dan to_shop_id sama
  - 403: admin membuat transfer dari toko yang bukan miliknya

### 2. GET /api/transfers/outgoing

- Auth: required
- Role: superAdmin, admin
- Query:
  - page, limit
  - shopId: uuid (opsional, sesuai shop access)
  - status: pending | approved | rejected | cancelled
- Success 200 paginated data item:
  - id, from_shop_id, to_shop_id, requested_by, confirmed_by, status, confirmed_at, note, created_at, updated_at
  - fromShop { id, name }
  - toShop { id, name }

### 3. GET /api/transfers/incoming

- Auth: required
- Role: superAdmin, admin
- Query:
  - page, limit
  - shopId: uuid (opsional, sesuai shop access)
  - status
- Success 200 paginated data:
  - sama seperti outgoing

### 4. GET /api/transfers/:transferId

- Auth: required
- Role: superAdmin, admin
- Success 200 data:
  - transfer detail
  - items: array

### 5. GET /api/transfers/:transferId/items

- Auth: required
- Role: superAdmin, admin
- Success 200 data: array
  - id, transfer_id, product_variant_id, qty, note
  - ProductVariant { id, name, sku, price }
  - Product { id, name }

### 6. PATCH /api/transfers/:transferId/approve

- Auth: required
- Role: superAdmin, admin, user
- Akses:
  - superAdmin: bisa approve transfer manapun tanpa batasan toko
  - admin/user: hanya bisa approve jika ditugaskan di toko tujuan transfer
- Catatan: user (kasir) bisa konfirmasi penerimaan transfer masuk ke tokonya
- Body: none
- Efek: stok dikurangi dari toko asal, ditambahkan ke toko tujuan, stock_movements dicatat
- Success 200 data:
  - transfer dengan status approved
- Error:
  - 400: transfer bukan berstatus pending
  - 403: bukan admin/kasir toko tujuan (untuk non-superAdmin)

### 7. PATCH /api/transfers/:transferId/reject

- Auth: required
- Role: superAdmin, admin
- Akses:
  - superAdmin: bisa reject transfer manapun tanpa batasan toko
  - admin: hanya bisa reject jika ditugaskan di toko tujuan transfer
- Body: none
- Success 200 data:
  - transfer dengan status rejected
- Error:
  - 400: transfer bukan berstatus pending
  - 403: bukan admin toko tujuan (untuk non-superAdmin)

### 8. PATCH /api/transfers/:transferId/cancel

- Auth: required
- Role: superAdmin, admin
- Akses:
  - superAdmin: bisa cancel transfer manapun tanpa batasan toko
  - admin: hanya bisa cancel jika ditugaskan di toko asal transfer
- Body: none
- Success 200 data:
  - transfer dengan status cancelled
- Error:
  - 400: transfer bukan berstatus pending
  - 403: bukan admin toko asal (untuk non-superAdmin)

---

## I. Customers

### 1. GET /api/customers

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - page, limit
  - search: nama/phone/email
- Catatan: user (kasir) perlu akses ini untuk memilih pelanggan saat transaksi
- Success 200 paginated data item:
  - id, name, phone, email, address, created_at, updated_at

### 2. POST /api/customers

- Auth: required
- Role: superAdmin, admin, user
- Body:
  - name: string, required
  - phone: string, optional (unik)
  - email: string, optional (unik)
  - address: string, optional
- Catatan: user (kasir) bisa membuat pelanggan baru saat transaksi
- Success 201 data:
  - id, name, phone, email, address, created_at, updated_at

### 3. GET /api/customers/:customerId

- Auth: required
- Role: superAdmin, admin, user
- Success 200 data:
  - id, name, phone, email, address, created_at, updated_at

### 4. PATCH /api/customers/:customerId

- Auth: required
- Role: superAdmin, admin
- Body (opsional):
  - name, phone, email, address
- Success 200 data:
  - customer terbaru

### 5. DELETE /api/customers/:customerId

- Auth: required
- Role: superAdmin, admin
- Success 200 data: null

### 6. GET /api/customers/:customerId/transactions

- Auth: required
- Role: superAdmin, admin
- Query:
  - page, limit
- Success 200 paginated data item:
  - id, shop_id, user_id, customer_id, invoice_no, status, payment_method, subtotal, paid_at, note, created_at, updated_at
  - TransactionItems: array

---

## J. Transactions

### 1. GET /api/transactions

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - page, limit
  - shopId: uuid (opsional, sesuai mekanisme shop access)
  - status: pending | completed | cancelled
  - payment_method: cash | transfer | qris | credit
  - customer_id: uuid
  - user_id: uuid (filter per kasir — berguna untuk admin melihat transaksi per kasir)
  - date_from: ISO date string
  - date_to: ISO date string
- Success 200 paginated data item:
  - id, shop_id, user_id, customer_id, invoice_no, status, payment_method, subtotal, paid_at, note, created_at, updated_at
  - Shop: { id, name }
  - User: { id, name }
  - Customer: { id, name, phone } atau null

### 2. POST /api/transactions

- Auth: required
- Role: superAdmin, admin, user
- Body:
  - shop_id: uuid, required
  - customer_id: uuid, optional
  - payment_method: cash | transfer | qris | credit, required
  - note: string, optional
  - items: array, required minimal 1 item
    - product_variant_id: uuid, required
    - qty: number > 0, required
    - price: number, optional (default: harga dari variant)
- Success 201 data:
  - transaction object + items + Shop + User + Customer
  - invoice_no format: INV/YYYY/MM/000001
  - status: completed (jika bukan credit) | pending (jika credit)
  - paid_at: timestamp atau null (jika pending)
- Error:
  - 403: user tidak punya akses ke shop
  - 404: toko / customer / variant tidak ditemukan
  - 400: stok tidak mencukupi, payment_method tidak valid, items kosong

### 3. GET /api/transactions/:transactionId

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - shopId: uuid (opsional, sesuai shop access)
- Success 200 data:
  - transaction fields
  - items: array
    - id, transaction_id, product_variant_id, qty, price, cost_price, subtotal
    - ProductVariant: { id, name, sku, price }
    - Product: { id, name }
  - Shop, User, Customer
- Error:
  - 403: transaksi bukan milik toko user
  - 404: transaksi tidak ditemukan

### 4. PATCH /api/transactions/:transactionId/cancel

- Auth: required
- Role: superAdmin, admin, user
- Query:
  - shopId: uuid (opsional, sesuai shop access)
- Body: none
- Efek:
  - status menjadi cancelled
  - stok dikembalikan ke inventory per item
  - StockMovement type refund dicatat per item
- Success 200 data:
  - transaction terbaru
- Error:
  - 400: transaksi sudah dibatalkan
  - 403: transaksi bukan milik toko user
  - 404: transaksi tidak ditemukan

---

## K. Refunds

### 1. GET /api/refunds

- Auth: required
- Role: superAdmin, admin
- Query:
  - page, limit
  - shopId: uuid (opsional, sesuai shop access)
  - status: pending | approved | rejected
  - transaction_id: uuid
- Success 200 paginated data item:
  - id, transaction_id, user_id, reason, total_amount, status, created_at, updated_at
  - User: { id, name }
  - Transaction: { id, invoice_no, shop_id, Shop: { id, name } }

### 2. POST /api/refunds

- Auth: required
- Role: superAdmin, admin, user
- Body:
  - transaction_id: uuid, required
  - reason: string, optional
  - items: array, required minimal 1 item
    - transaction_item_id: uuid, required
    - qty: number > 0, required (tidak boleh melebihi qty pembelian)
- Success 201 data:
  - refund object + items + User + Transaction
  - status: pending (menunggu persetujuan admin)
- Error:
  - 400: transaksi bukan berstatus completed, qty melebihi pembelian, items kosong
  - 403: user tidak punya akses ke toko transaksi
  - 404: transaksi atau transaction item tidak ditemukan

### 3. GET /api/refunds/:refundId

- Auth: required
- Role: superAdmin, admin
- Query:
  - shopId: uuid (opsional, sesuai shop access)
- Success 200 data:
  - refund fields
  - items: array
    - id, refund_id, transaction_item_id, qty, amount
    - TransactionItem: { id, product_variant_id, qty, price }
  - User, Transaction + Shop

### 4. PATCH /api/refunds/:refundId/approve

- Auth: required
- Role: superAdmin, admin
- Query:
  - shopId: uuid (opsional, sesuai shop access)
- Body: none
- Efek:
  - status menjadi approved
  - stok dikembalikan ke inventory per item
  - StockMovement type refund dicatat per item
- Success 200 data:
  - refund terbaru
- Error:
  - 400: refund bukan berstatus pending
  - 403: akses ditolak
  - 404: refund tidak ditemukan

### 5. PATCH /api/refunds/:refundId/reject

- Auth: required
- Role: superAdmin, admin
- Query:
  - shopId: uuid (opsional, sesuai shop access)
- Body: none
- Efek: status menjadi rejected, stok tidak berubah
- Success 200 data:
  - refund terbaru
- Error:
  - 400: refund bukan berstatus pending

---

## L. Audit Logs

### 1. GET /api/audit-logs

- Auth: required
- Role: superAdmin, admin
- Query:
  - page, limit
  - shopId: uuid (opsional, sesuai shop access)
  - entity_type: string (misal: transaction, product, user)
  - action: create | update | delete | login | logout
  - user_id: uuid
  - date_from: ISO date string
  - date_to: ISO date string
- Success 200 paginated data item:
  - id, entity_type, entity_id, action, old_values, new_values, ip_address, user_agent, created_at
  - User: { id, name, email } atau null
  - Shop: { id, name } atau null
- Catatan:
  - Audit log ditulis otomatis oleh sistem saat operasi penting terjadi
  - Endpoint ini hanya baca (read-only)

---

## 7) Contoh Response Ringkas

### Contoh success paginated

- success: true
- message: Daftar produk berhasil diambil
- data: [ ... ]
- meta:
  - total: 15
  - page: 1
  - limit: 20
  - totalPages: 1

### Contoh success non paginated

- success: true
- message: Detail produk berhasil diambil
- data:
  - id: 55555555-5555-4555-8555-555555550001
  - name: Aqua Botol
  - image_url: /seed-images/AQU_1500.webp
  - variants: [ ... ]

### Contoh error

- success: false
- message: Akses ke toko ini tidak diizinkan

## 8) Catatan Integrasi FE

### Token & Auth
- Simpan accessToken di memory atau storage aman sesuai kebijakan aplikasi.
- Pada 401 karena access token expired, panggil POST /api/auth/refresh lalu retry request asli.
- Semua endpoint protected wajib header: `Authorization: Bearer <accessToken>`.

### Shop Access
- Untuk admin/user pada endpoint ber-shopAccess, selalu kirim `?shopId=<uuid>` untuk menghindari error 400 (multi-toko ambiguous).
- superAdmin tidak wajib kirim shopId — jika tidak dikirim, data tampil lintas toko.

### Produk & Gambar
- `POST /api/products` wajib menyertakan minimal 1 variant dalam array `variants`. Tidak bisa membuat produk tanpa variant.
- `image_url` pada response product adalah turunan otomatis dari variant pertama aktif (sort SKU ASC). Gunakan ini untuk product card/list.
- Untuk halaman detail variant, gunakan `image_url` langsung dari data variant.
- Upload gambar variant: gunakan `PATCH /api/products/:productId/variants/:variantId` dengan field `image_url` berupa URL string (bukan file upload langsung di endpoint ini).

### Kasir (role: user)
- Kasir hanya bisa akses toko yang ditugaskan. Semua endpoint ber-shopAccess akan otomatis di-scope ke toko tersebut.
- Kasir bisa: membuat transaksi, membuat produk & variant (global), melihat stok, memilih/membuat pelanggan, mengajukan refund, menyetujui transfer masuk.
- Kasir TIDAK bisa: restock, adjustment stok, set threshold, reject/cancel transfer, approve/reject refund, melihat list refund, akses audit log, akses toko lain.
- Untuk halaman kasir (POS), ambil daftar produk dari `GET /api/products` (sudah include variants & image_url), lalu ambil daftar pelanggan dari `GET /api/customers`.

### Transfer
- Approve transfer: superAdmin bebas approve transfer manapun. Admin/kasir hanya bisa approve transfer yang masuk ke toko mereka.
- Reject/Cancel transfer: hanya superAdmin dan admin.
- Untuk menampilkan tombol approve/reject/cancel di UI, sesuaikan dengan role dan kepemilikan toko.

### Transaksi
- Filter `user_id` di `GET /api/transactions` berguna untuk admin menampilkan transaksi per kasir.
- Status transaksi otomatis `completed` untuk semua metode pembayaran kecuali `credit` (menjadi `pending`).
