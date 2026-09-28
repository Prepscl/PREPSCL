export default function SocialFooter() {
  return (
    <footer className="social-footer">
      <nav aria-label="Redes sociales">
        <a href="https://www.instagram.com/prepscl/" target="_blank" rel="noopener noreferrer" aria-label="PREPS en Instagram (abre en otra pestaña)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
          </svg>
          Instagram
        </a>
      </nav>
    </footer>
  );
}
