import React from 'react';
import { Mail, Phone, Facebook, Instagram } from 'lucide-react';

interface FooterProps {
  onViewChange: (view: string) => void;
}

export function Footer({ onViewChange }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white text-lg mb-4">Occitours</h3>
            <p className="text-sm mb-4">
              Tu mejor aliado para descubrir la magia de la naturaleza colombiana.
            </p>
            <div className="flex space-x-3">
              <div className="relative group flex items-center justify-center">
                <a
                  href="https://www.facebook.com/people/Occitours/61577264948801/?ref=PROFILE_EDIT_xav_ig_profile_page_web#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                {/* Tooltip Facebook */}
                <span className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  ¡Únete a nuestra comunidad en Facebook! 👍
                </span>
              </div>
              <div className="relative group flex items-center justify-center">
                <a
                  href="https://www.instagram.com/occitours/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                {/* Tooltip Instagram */}
                <span className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  ¡Síguenos en Instagram para ver más de nuestros viajes! 📸
                </span>
              </div>
              <div className="relative group flex items-center justify-center">
                <a
                  href="https://www.tiktok.com/@occitours"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
                  </svg>
                </a>
                {/* Tooltip TikTok */}
                <span className="absolute bottom-full mb-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  ¡Descubre nuestros videos en TikTok! 🎵
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onViewChange('home')} className="hover:text-green-400 transition-colors">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('about')} className="hover:text-green-400 transition-colors">
                  Quiénes Somos
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('routes')} className="hover:text-green-400 transition-colors">
                  Rutas
                </button>
              </li>
              <li>
                <button onClick={() => onViewChange('farms')} className="hover:text-green-400 transition-colors">
                  Fincas
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onViewChange('terms')} className="hover:text-green-400 transition-colors">
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <button onClick={() => onViewChange('cancellation')} className="hover:text-green-400 transition-colors">
                  Políticas de Cancelación
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white mb-4">Ayuda y Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-green-400" />
                <a href="mailto:Gerenciaoccitours@gmail.com" className="hover:text-green-400 transition-colors">
                  Gerenciaoccitours@gmail.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-green-400" />
                <a href="tel:+573043898018" className="hover:text-green-400 transition-colors">
                  +57 304 3898018
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-green-400 transition-colors">
                  Centro de Ayuda
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>Occitours &copy; 2025</p>
          <p className="mt-1">RNT: 250112</p>
          <p className="mt-1 text-gray-400">Agencia operadora registrada</p>
        </div>
      </div>
    </footer>
  );
}
