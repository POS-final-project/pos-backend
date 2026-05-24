'use strict';

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Returns all dashboard metrics.
 * @param {string|null} shopId - null = aggregate all shops (superAdmin only)
 */
async function getSummary(shopId) {
  const hasShop = Boolean(shopId);
  const sf  = hasShop ? 'AND shop_id = :shopId' : '';       // direct table filter
  const tsf = hasShop ? 'AND t.shop_id = :shopId' : '';     // joined transactions
  const isf = hasShop ? 'AND i.shop_id = :shopId' : '';     // joined inventory
  const r   = hasShop ? { shopId } : {};

  const [
    [revToday],
    [revMonth],
    [txToday],
    [txMonth],
    [txRefunded],
    trend,
    topProducts,
    paymentBreakdown,
    lowStock,
  ] = await Promise.all([

    // ── Revenue hari ini ──────────────────────────────────────────────────────
    sequelize.query(`
      SELECT COALESCE(SUM(subtotal), 0)::float AS value
      FROM transactions
      WHERE status = 'selesai' ${sf}
        AND DATE(paid_at) = CURRENT_DATE
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Revenue bulan ini ─────────────────────────────────────────────────────
    sequelize.query(`
      SELECT COALESCE(SUM(subtotal), 0)::float AS value
      FROM transactions
      WHERE status = 'selesai' ${sf}
        AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Transaksi hari ini ────────────────────────────────────────────────────
    sequelize.query(`
      SELECT COUNT(*)::int AS value
      FROM transactions
      WHERE status = 'selesai' ${sf}
        AND DATE(paid_at) = CURRENT_DATE
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Transaksi bulan ini ───────────────────────────────────────────────────
    sequelize.query(`
      SELECT COUNT(*)::int AS value
      FROM transactions
      WHERE status = 'selesai' ${sf}
        AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Refunded bulan ini ────────────────────────────────────────────────────
    sequelize.query(`
      SELECT COUNT(*)::int AS value
      FROM transactions
      WHERE status = 'refunded' ${sf}
        AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE)
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Tren pendapatan 14 hari (isi hari kosong dengan 0) ───────────────────
    sequelize.query(`
      WITH days AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '13 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS day
      ),
      tx AS (
        SELECT
          DATE(paid_at) AS day,
          COALESCE(SUM(subtotal), 0)::float AS revenue,
          COUNT(*)::int AS tx_count
        FROM transactions
        WHERE status = 'selesai' ${sf}
          AND paid_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY DATE(paid_at)
      )
      SELECT
        d.day::text         AS date,
        COALESCE(t.revenue,  0) AS revenue,
        COALESCE(t.tx_count, 0) AS count
      FROM days d
      LEFT JOIN tx t ON t.day = d.day
      ORDER BY d.day
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Top 5 produk terlaris bulan ini ───────────────────────────────────────
    sequelize.query(`
      SELECT
        p.name             AS product_name,
        pv.name            AS variant_name,
        COALESCE(pv.sku, '-') AS sku,
        SUM(ti.qty)::int   AS total_qty,
        SUM(ti.subtotal)::float AS total_revenue
      FROM transaction_items ti
      JOIN transactions    t   ON t.id  = ti.transaction_id
      JOIN product_variants pv ON pv.id = ti.product_variant_id
      JOIN products         p  ON p.id  = pv.product_id
      WHERE t.status = 'selesai'
        ${tsf}
        AND DATE_TRUNC('month', t.paid_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY p.name, pv.name, pv.sku
      ORDER BY total_qty DESC
      LIMIT 5
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Metode pembayaran bulan ini ───────────────────────────────────────────
    sequelize.query(`
      SELECT
        payment_method,
        COUNT(*)::int AS count,
        COALESCE(SUM(subtotal), 0)::float AS revenue
      FROM transactions
      WHERE status = 'selesai' ${sf}
        AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY payment_method
    `, { replacements: r, type: QueryTypes.SELECT }),

    // ── Stok kritis (stok ≤ threshold) ───────────────────────────────────────
    sequelize.query(`
      SELECT
        s.name   AS shop_name,
        p.name   AS product_name,
        pv.name  AS variant_name,
        COALESCE(pv.sku, '-') AS sku,
        i.stock,
        i.reserved_stock,
        i.low_stock_threshold AS threshold
      FROM inventory i
      JOIN shops            s  ON s.id  = i.shop_id
      JOIN product_variants pv ON pv.id = i.product_variant_id
      JOIN products         p  ON p.id  = pv.product_id
      WHERE ${hasShop ? 'i.shop_id = :shopId' : 'TRUE'}
        AND i.stock <= i.low_stock_threshold
        AND p.is_active  = TRUE
        AND pv.is_active = TRUE
        AND s.is_active  = TRUE
      ORDER BY (i.stock - i.low_stock_threshold) ASC
      LIMIT 10
    `, { replacements: r, type: QueryTypes.SELECT }),
  ]);

  return {
    revenue: {
      today:      revToday.value,
      this_month: revMonth.value,
    },
    transactions: {
      today:                txToday.value,
      this_month:           txMonth.value,
      refunded_this_month:  txRefunded.value,
    },
    trend,
    top_products:       topProducts,
    payment_breakdown:  paymentBreakdown,
    low_stock:          lowStock,
  };
}

module.exports = { getSummary };
