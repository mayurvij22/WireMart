import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { INSTAGRAM_ACCOUNTS, SHOP_NAME, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../../config';
import { WhatsAppIcon } from '../../components/BuyButton';
import SearchBar from '../../components/SearchBar';
import { useCategories } from '../../hooks/useCategories';

const chatLink = `https://wa.me/${WHATSAPP_NUMBER}`;
const callLink = `tel:+${WHATSAPP_NUMBER}`;

const searchClasses = {
  form: 'relative flex w-full items-center',
  icon: 'pointer-events-none absolute left-3.5 text-sm opacity-60',
  input:
    'h-11 min-h-0 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-[15px] text-ink placeholder:text-gray-500 focus:border-ink focus:outline-none [&::-webkit-search-cancel-button]:hidden',
  clear: 'absolute right-1 grid size-9 place-items-center rounded-md text-gray-500 hover:bg-gray-100',
};

function Logo() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5 text-ink no-underline">
      <span aria-hidden="true" className="grid size-10 flex-none place-items-center rounded-xl bg-ink text-lg text-white">
        ⚡
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-base font-extrabold tracking-tight">Yogeshwar Patil</span>
        <span className="truncate text-xs font-medium text-gray-500">Electrical &amp; Nal Fitting</span>
      </span>
    </Link>
  );
}

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onHome = location.pathname === '/';
  const q = onHome ? params.get('q') || '' : '';

  // Searching from any page lands on the product list; on Home it keeps the chosen category.
  function search(text) {
    const next = new URLSearchParams(onHome ? params : undefined);
    if (text) next.set('q', text);
    else next.delete('q');
    const qs = next.toString();
    navigate(qs ? `/?${qs}` : '/', { replace: onHome });
  }

  const searchBox = <SearchBar value={q} onChange={search} placeholder="Search for switches, wires, taps…" classes={searchClasses} />;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Logo />
        <div className="ml-auto hidden w-full max-w-md md:block">{searchBox}</div>
        <nav className="ml-auto flex flex-none items-center gap-2 md:ml-0">
          <a
            href={callLink}
            className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink no-underline hover:bg-gray-100 lg:inline-flex"
          >
            <span aria-hidden="true">📞</span> Call us
          </a>
          <a
            href={chatLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-buy px-3 text-sm font-semibold text-white no-underline hover:bg-buy-dark"
          >
            <WhatsAppIcon />
            <span className="hidden sm:inline">{WHATSAPP_DISPLAY}</span>
          </a>
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden">{searchBox}</div>
    </header>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div>
      <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>
      <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm text-gray-600">{children}</ul>
    </div>
  );
}

const footerLink = 'text-gray-600 no-underline hover:text-ink hover:underline';
const socialIcon =
  'inline-grid size-10 place-items-center rounded-full border border-gray-300 bg-white text-ink hover:border-ink';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Footer() {
  const { categories } = useCategories();

  return (
    <footer className="mt-16 bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
        <Logo />
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          <FooterColumn title="Shop">
            <li>
              <Link to="/" className={footerLink}>
                All products
              </Link>
            </li>
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={`/?cat=${c.id}`} className={footerLink}>
                  {c.name}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="For customers">
            <li>Browse &amp; pick a product</li>
            <li>Tap “Buy Now” to order on WhatsApp</li>
            <li>Pay &amp; collect or get it delivered</li>
          </FooterColumn>

          <FooterColumn title="Contact us">
            <li>
              <a href={chatLink} target="_blank" rel="noopener noreferrer" className={footerLink}>
                WhatsApp: {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>
              <a href={callLink} className={footerLink}>
                Call: {WHATSAPP_DISPLAY}
              </a>
            </li>
          </FooterColumn>

          <div>
            <h3 className="mb-4 text-base font-bold text-ink">Social links</h3>
            <div className="flex gap-3">
              <a href={chatLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className={socialIcon}>
                <WhatsAppIcon />
              </a>
              <a
                href={`https://www.instagram.com/${INSTAGRAM_ACCOUNTS[0]}/`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={socialIcon}
              >
                <InstagramIcon />
              </a>
            </div>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 text-sm">
              {INSTAGRAM_ACCOUNTS.map((handle) => (
                <li key={handle}>
                  <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer" className={footerLink}>
                    @{handle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-8 border-0 border-t border-gray-300" />
        <p className="m-0 text-xs text-gray-500">
          © {new Date().getFullYear()} {SHOP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-ink">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
