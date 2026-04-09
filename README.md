# Customer Web App

Aplikasi publik terpisah untuk pelanggan order lewat HP.

## Jalankan

1. Masuk ke folder:
   `cd customer-web`
2. Install dependency:
   `npm install`
3. Jalankan:
   `npm run dev`

Default berjalan di `http://localhost:5174`.

## Koneksi API

Set environment jika backend bukan default:

`VITE_POS_API_URL=http://localhost:3001/api`

Buat file `.env` di folder `customer-web`.

## Fitur

- List produk + kategori + search.
- Cart pelanggan.
- Submit order ke backend POS.
- Opsi bayar:
  - Bayar di kasir.
  - Bayar QS (otomatis set status paid).
- Tracking status order real-time polling.