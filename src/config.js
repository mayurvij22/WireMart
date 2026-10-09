// Shop settings — change the WhatsApp number here only.
export const SHOP_NAME = 'Yogeshwar Patil – Electrical & Nal Fitting';

// WhatsApp messages sent when a customer taps "Buy Now" (in stock) or
// "Ask on WhatsApp" (out of stock). {name} and {price} are filled in automatically.
export const ORDER_MESSAGE = 'नमस्कार योगेश्वर, मला हे खरेदी करायचे आहे: {name} - किंमत: {price}';
export const ENQUIRY_MESSAGE = 'नमस्कार योगेश्वर, हे उपलब्ध आहे का: {name} - किंमत: {price}?';

// International format without "+" or spaces, as wa.me expects.
export const WHATSAPP_NUMBER = '918208104775';
export const WHATSAPP_DISPLAY = '+91 82081 04775';

// Instagram accounts shown in the footer.
export const INSTAGRAM_ACCOUNTS = ['yogesh_electric', 'yogeshwarelectrical'];

// Admin logs in with a plain username (e.g. "yogesh"). In Firebase the account
// is created as "<username>@<this domain>". It doesn't need to be a real domain.
export const ADMIN_LOGIN_DOMAIN = 'wiremart.app';

// Products fetched per page (each product = 1 Firestore read).
export const PAGE_SIZE = 20;

// How long customers' phones keep the category list before re-reading it.
export const CATEGORY_CACHE_HOURS = 6;
