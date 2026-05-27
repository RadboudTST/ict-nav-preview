import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

// TikTok and Snapchat icons (not in Lucide)
const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
  </svg>
);

export default function PreviewFooter() {
  return (
    <footer className="bg-ru-light-gray border-t border-ru-border">
      {/* Main footer - 4 columns */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid grid-cols-4 gap-8">
          {/* Column 1: Informatie voor */}
          <div>
            <h3 className="font-bold text-ru-text text-[15px] mb-3">Informatie voor</h3>
            <ul className="space-y-1.5">
              {['Studenten', 'Medewerkers', 'Alumni', 'Pers', 'Scholen'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-ru-red-impact underline hover:text-ru-maroon text-[14px]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Meer over */}
          <div>
            <h3 className="font-bold text-ru-text text-[15px] mb-3">Meer over</h3>
            <ul className="space-y-1.5">
              {['Opleidingen', 'Onderzoek', 'Faciliteiten & samenwerken', 'Werken bij', 'De Radboud Universiteit'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-ru-red-impact underline hover:text-ru-maroon text-[14px]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-bold text-ru-text text-[15px] mb-3">Contact</h3>
            <ul className="space-y-1.5">
              {['Contactgegevens', 'Zoek medewerker', 'Bereikbaarheid'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-ru-red-impact underline hover:text-ru-maroon text-[14px]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Adres */}
          <div>
            <h3 className="font-bold text-ru-text text-[15px] mb-3">Adres</h3>
            <p className="text-[14px] text-ru-text mb-2">
              Houtlaan 4<br />
              6525 XZ Nijmegen
            </p>
            <a href="#" className="text-ru-red-impact underline hover:text-ru-maroon text-[14px]">
              Neem contact op
            </a>

            {/* Social media icons */}
            <div className="flex gap-2 mt-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Youtube, label: 'YouTube' },
                { icon: TikTokIcon, label: 'TikTok', isCustom: true },
                { icon: SnapchatIcon, label: 'Snapchat', isCustom: true },
              ].map(({ icon: Icon, label, isCustom }) => (
                <a
                  key={label}
                  href="#"
                  className="w-8 h-8 rounded-full bg-ru-gray flex items-center justify-center text-white hover:bg-ru-maroon transition-colors"
                  aria-label={label}
                >
                  {isCustom ? <Icon /> : <Icon size={14} />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary footer - disclaimer */}
      <div className="bg-white border-t border-ru-border">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-[13px] text-ru-gray flex items-center gap-2">
            <a href="#" className="hover:underline">©{new Date().getFullYear()} - Disclaimer</a>
            <span>|</span>
            <a href="#" className="hover:underline">Privacy & cookies</a>
          </div>
          <img
            src="/ru-logo-official.svg"
            alt="Radboud Universiteit"
            className="h-8 opacity-40"
          />
        </div>
      </div>
    </footer>
  );
}
