# WireMart: Yogeshwar Patil – Electrical & Nal Fitting

A mobile-first product catalog. Customers browse and order on WhatsApp; Yogesh manages products from `/admin`.

- **Frontend:** React + Vite, React Router, hosted on **Vercel (free Hobby plan)**
- **Backend:** **Firebase Spark (free) plan**: Firestore and Authentication only. No Storage, no Hosting, no Cloud Functions.

## Folder structure

```
├── index.html
├── vercel.json               # SPA rewrite → index.html (no 404 on refresh)
├── .env.example              # Firebase config variable names
├── firebase.json / .firebaserc
├── firestore.rules           # Public read, admin-only write
├── firestore.indexes.json    # Composite indexes for category + search queries
├── public/favicon.svg
└── src/
    ├── config.js             # Shop name, WhatsApp number, page size, cache time
    ├── firebase.js           # Firebase init from import.meta.env
    ├── App.jsx               # Routes: /, /product/:id, /admin/*
    ├── index.css
    ├── lib/
    │   ├── catalog.js        # Firestore reads/writes, pagination, caching
    │   ├── format.js         # ₹ formatting, search keywords, WhatsApp link
    │   └── csv.js            # CSV parser for bulk import
    ├── hooks/                # useCategories, useProductList
    ├── components/           # ProductCard, BuyButton, SearchBar, …
    ├── pages/customer/       # Home, ProductDetail, layout
    └── admin/                # Lazy-loaded admin bundle (login, products, categories, import)
```

## Firestore data

| Collection | Fields |
|---|---|
| `products` | `name`, `nameLower`, `keywords` (array of word prefixes, for search), `price` (number), `category` (category **document id**), `features` (array), `imageUrl`, `description`, `inStock` (bool), `createdAt`, `updatedAt` |
| `categories` | `name` |

Two details about how the data is stored:
- **The `category` field holds the category's document id, not its name.** Renaming a category is then a single write, instead of rewriting every product in that category.
- **Search uses the `keywords` field.** It holds every prefix of every word in the name, the category name and the feature values (series, code, rating…), plus singular forms and joined forms. So "switch", "switches", "swi", "6a", "6 a", "1way", "woodem", "plana" or a product code like "w90001" all find the right product. `nameLower` is used for A–Z sorting. The admin form and the CSV import fill in both fields automatically. After renaming a category (or once, for products saved before this was added) use **Admin → Categories → Update search for all products**.

## Cart and bill
Customers can add several products to a cart (stored on their phone), change quantities, and see a bill with line totals and the grand total. **Order on WhatsApp** sends the itemised bill in one message (text set by `CART_ORDER_MESSAGE` in `src/config.js`). The cart costs no Firestore reads.

### How reads are kept low (free limit is 50,000 reads/day)
- Products load **20 at a time** with `limit()` + `startAfter()`, and only when "Load More" is tapped.
- The **category list is cached on each phone for 6 hours** (`CATEGORY_CACHE_HOURS` in `src/config.js`).
- Loaded product lists are kept in memory. Opening a product and pressing Back costs **0 reads**, and so does opening a product from a list.
- Search waits until the user stops typing (500 ms), so it doesn't query on every keystroke.

As a rough guide, 200 customers × 3 visits × ~60 products each comes to about 36,000 reads/day in the worst case. Typical use is far lower.

---

## Setup steps

Your Firebase project **`customer-acd09`** already exists. `.env.local` is filled in with its config and is gitignored.

### 1. Turn on Firestore
1. Open [Firebase console](https://console.firebase.google.com/project/customer-acd09) → **Build → Firestore Database → Create database**.
2. Choose **Production mode**. For location, pick **asia-south1 (Mumbai)**. The location can't be changed later.

### 2. Turn on login and create Yogesh's admin account
1. Go to **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save**.
2. Go to **Users → Add user**:
   - Email: `yogesh@wiremart.app` (Yogesh logs in with just the username **`yogesh`**; the app adds `@wiremart.app`, set by `ADMIN_LOGIN_DOMAIN` in `src/config.js`. It doesn't need to be a real email.)
   - Password: at least 6 characters
3. Copy the **User UID** shown in the users list.
4. Open `firestore.rules` and replace `REPLACE_WITH_YOGESH_UID` with that UID.

> **Changing the password later:** because the login isn't a real email, there's no "forgot password" email. Change it in Firebase console → Authentication → Users → ⋮ next to the user → **Reset password**.

> Why a UID and not just "logged in"? Anyone can create an email/password account through Firebase's public API. Checking the UID makes sure only Yogesh can change products.

### 3. Publish the security rules and indexes
**Option A: Firebase CLI (recommended; it creates the indexes for you)**
```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore
```
Index creation takes a few minutes. You can watch it under Firestore → **Indexes**.

**Option B: Console only**
- Go to Firestore → **Rules**, paste the contents of `firestore.rules`, and click **Publish**.
- Go to Firestore → **Indexes → Composite → Create index** (collection `products`) for each of these:
  1. `category` Ascending, `nameLower` Ascending
  2. `keywords` Arrays, `nameLower` Ascending
  3. `category` Ascending, `keywords` Arrays, `nameLower` Ascending

  If one is missing, the app shows an error containing a link that creates it in one click.

### 4. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173 for the shop and http://localhost:5173/admin to log in.

### 5. Push the code to GitHub
The repo is already linked to `https://github.com/mayurvij22/WireMart.git`:
```bash
git add .
git commit -m "Product catalog app"
git push -u origin main
```
`.env.local` is **not** uploaded (see `.gitignore`).

### 6. Import into Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New → Project**, and import the `WireMart` repository.
2. Vercel detects **Vite** automatically. Build command: `npm run build`, output folder: `dist`.
3. Before deploying, open **Environment Variables** and add each line from `.env.local`:

   | Name | Value |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `AIzaSyC2e9gGOz6I5RY6Bn92QpzR33tlqFiokDg` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `customer-acd09.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `customer-acd09` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `753085687783` |
   | `VITE_FIREBASE_APP_ID` | `1:753085687783:web:268018fdc9eeea2c1dbf42` |

4. Click **Deploy**. Your site will be at something like `https://wiremart.vercel.app`.
   If you change environment variables later, go to **Deployments → Redeploy**, because Vite builds them into the app at build time.

### 7. Allow the Vercel domain in Firebase Auth
Go to Firebase console → **Authentication → Settings → Authorized domains → Add domain**, and add your `*.vercel.app` domain. Add any custom domain too. If you skip this, admin login fails on the live site.

### 8. Add products
- **One at a time:** `/admin` → **+ Add**. Use **Save & Add Another** for fast entry; it keeps the selected category.
- **In bulk:** `/admin` → **Import**. Download the template, fill it in Excel or Google Sheets (separate features with `|`), save as CSV, and upload. Categories that don't exist yet are created automatically. The free plan allows **20,000 writes/day**, so import 10,000 items in one day or spread them over two.
- **Images:** paste any public image URL. A free image host such as ImgBB or Cloudinary's free tier works well. Google Drive also works: set the file (or its folder) to **Anyone with the link → Viewer** and paste the share link; the app converts it to a direct image link automatically.

### 9. Product photos (stored in Firestore)
In the product form, tap **📷 Add Photo** and pick a photo or take one with the camera. The phone shrinks it to max 600px (~30–40 KB, WebP) and it's saved **inside the product's Firestore document** as a data URL in `imageUrl`. No extra service or setup is needed.

Why this way: Firebase Storage needs the paid Blaze plan, so photos live in Firestore for now.
- **Reads:** no extra cost. A product and its photo are one document, so one read.
- **Size:** each photo is capped at ~150 KB by the app (and 250 KB by `firestore.rules`), well under Firestore's 1 MB document limit.
- **Network:** the Spark plan includes 10 GiB/month of Firestore downloads. At ~40 KB per product, that's roughly 250,000 product views a month.
- Pasting an image link still works (including Google Drive share links set to "Anyone with the link").

**Migrating later:** to move photos to an image host (Cloudinary, Firebase Storage on Blaze, etc.), upload each `data:image/...` value and replace `imageUrl` with the new link. Nothing else in the app changes.

---

## Customising
- **WhatsApp number, shop name, page size, cache time:** `src/config.js`
- **WhatsApp messages (Marathi):** `ORDER_MESSAGE` and `ENQUIRY_MESSAGE` in `src/config.js`. `{name}` and `{price}` are filled in automatically.
  - In stock (**Buy Now**): `नमस्कार योगेश्वर, मला हे खरेदी करायचे आहे: <Product> - किंमत: ₹<Price>`
  - Out of stock (**Ask on WhatsApp**): `नमस्कार योगेश्वर, हे उपलब्ध आहे का: <Product> - किंमत: ₹<Price>?`

## Notes
- The Firebase web API key isn't a secret; it ships in every Firebase web app. Security comes from `firestore.rules`. You can also limit the key to your domains in Google Cloud Console → APIs & Services → Credentials, under HTTP referrers.
- The app uses `firebase/firestore/lite`, which is smaller and faster on mobile data. The admin/login code is a separate file that customers never download.
- Firestore can't do "contains anywhere" text search. Search matches the **start of any word** in the product name.
