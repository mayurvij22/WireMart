import { Link, Outlet } from 'react-router-dom';
import { SHOP_NAME, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '../../config';
import { WhatsAppIcon } from '../../components/BuyButton';

const chatLink = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function CustomerLayout() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-bolt" aria-hidden="true">⚡</span>
            <span>{SHOP_NAME}</span>
          </Link>
          <a className="header-wa" href={chatLink} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${WHATSAPP_DISPLAY}`}>
            <WhatsAppIcon />
            <span className="header-wa-text">{WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Order on WhatsApp</p>
        <a className="footer-wa" href={chatLink} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon /> {WHATSAPP_DISPLAY}
        </a>
      </footer>
    </>
  );
}
