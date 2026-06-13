import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Shield, Users, Leaf, Heart, ArrowRight, MapPin,
  Facebook, Instagram, Mail, Phone, Star, CheckCircle,
  Mountain, Award, Handshake
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AboutUsPageProps {
  onViewChange: (view: string, itemId?: string) => void;
}

export function AboutUsPage({ onViewChange }: AboutUsPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }} className="min-h-screen bg-white">

      {/* ─────────────────────────────────────────
          HERO
      ───────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '65vh', background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)' }}>
        {/* Imagen de fondo con overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="/hero-bg.png"
            alt="Occitours paisaje"
            className="w-full h-full object-cover"
            style={{ opacity: 0.25 }}
          />
        </div>

        {/* Círculos decorativos (contenidos dentro del hero) */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', transform: 'translate(-30%, 30%)' }} />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-32">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(52,211,153,0.2)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            <MapPin className="w-4 h-4" />
            Occidente de Antioquia, Colombia
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white font-bold mb-5 leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', maxWidth: '700px' }}
          >
            Descubre la Esencia{' '}
            <span style={{ color: '#6ee7b7' }}>de Occitours</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ color: '#a7f3d0', maxWidth: '550px', fontSize: '1.1rem', lineHeight: '1.75' }}
          >
            Mucho más que turismo — una experiencia auténtica y transformadora
            en el corazón de la naturaleza colombiana.
          </motion.p>

          {/* Indicadores numéricos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap justify-center gap-8 mt-12"
          >
            {[
              { num: '100%', label: 'Experiencias auténticas' },
              { num: 'RNT', label: 'Registro Nacional de Turismo' },
              { num: '5★', label: 'Calidad garantizada' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-bold text-white" style={{ fontSize: '1.75rem' }}>{stat.num}</div>
                <div style={{ color: '#6ee7b7', fontSize: '0.8rem', marginTop: '2px' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Ondita inferior */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          QUIÉNES SOMOS
      ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div className="grid md:grid-cols-2 gap-16 items-center">

            {/* Columna izquierda: texto */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ background: '#ecfdf5', color: '#059669' }}>
                <Leaf className="w-4 h-4" />
                Nuestra Historia
              </div>
              <h2 className="font-bold text-gray-900 mb-6 leading-tight"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}>
                Conectamos viajeros con la esencia del territorio
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed" style={{ fontSize: '1rem' }}>
                <strong>Occitours</strong> es una agencia operadora de turismo ubicada en el
                Occidente de Antioquia. Nacimos con la convicción de mostrar la riqueza de
                nuestro territorio como un lugar lleno de vida, historias y tradiciones.
              </p>
              <p className="text-gray-600 leading-relaxed" style={{ fontSize: '1rem' }}>
                Ofrecemos experiencias turísticas organizadas, seguras y auténticas, conectando
                a los viajeros con la biodiversidad del entorno, la cultura local y la calidez
                de nuestras comunidades rurales.
              </p>

              {/* Puntos destacados */}
              <div className="mt-8 space-y-3">
                {[
                  'Operamos con Registro Nacional de Turismo (RNT: 250112)',
                  'Acompañamiento antes, durante y después del servicio',
                  'Alianzas con guías, artesanos y comunidades locales',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                    <span className="text-gray-600 text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Columna derecha: tarjeta visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ border: '3px solid #d1fae5' }}>
                <ImageWithFallback
                  src="/hero-bg.png"
                  alt="Paisaje Occitours"
                  className="w-full object-cover"
                  style={{ height: '380px' }}
                />
                {/* Tarjeta flotante dentro del bloque */}
                <div className="p-6" style={{ background: 'linear-gradient(to right, #065f46, #047857)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Mountain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">Occidente de Antioquia</div>
                      <div style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>Turismo responsable y sostenible</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          ENFOQUE: 4 TARJETAS
      ───────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#f0fdf4' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

          <div className="text-center mb-14">
            <h2 className="font-bold text-gray-900 mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              ¿Por qué viajar con nosotros?
            </h2>
            <p className="text-gray-500 mx-auto" style={{ maxWidth: '520px', fontSize: '1rem', lineHeight: '1.75' }}>
              No competimos por precio, sino por <strong>valor</strong>. Cada experiencia
              está diseñada para tu bienestar y el impacto positivo en la región.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield className="w-7 h-7" />, color: '#059669', bg: '#ecfdf5', title: 'Tranquilidad Total', desc: 'Nos encargamos de toda la logística para que tú solo disfrutes.' },
              { icon: <Heart className="w-7 h-7" />, color: '#e11d48', bg: '#fff1f2', title: 'Conexión Real', desc: 'Inmersión genuina con la comunidad, la cultura y el entorno natural.' },
              { icon: <Users className="w-7 h-7" />, color: '#2563eb', bg: '#eff6ff', title: 'Acompañamiento', desc: 'Profesionales apasionados que te guiarán en cada paso de la aventura.' },
              { icon: <CheckCircle className="w-7 h-7" />, color: '#7c3aed', bg: '#f5f3ff', title: 'Calidad y Seguridad', desc: 'Estándares estrictos para experiencias impecables y completamente seguras.' },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
                style={{ border: '1px solid #e5e7eb' }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-2" style={{ fontSize: '1rem' }}>{card.title}</h3>
                <p className="text-gray-500 leading-relaxed" style={{ fontSize: '0.875rem' }}>{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          VALORES — lista vertical elegante
      ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Encabezado + valores */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ background: '#ecfdf5', color: '#059669' }}>
                <Award className="w-4 h-4" />
                Nuestros Valores
              </div>
              <h2 className="font-bold text-gray-900 mb-4 leading-tight"
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}>
                Comprometidos con el territorio y las comunidades
              </h2>
              <p className="text-gray-500 mb-10 leading-relaxed">
                Trabajamos de la mano con guías baquianos, transportadores, cocineros
                tradicionales, artesanos y comunidades campesinas del Occidente antioqueño.
              </p>

              <div className="space-y-6">
                {[
                  { num: '01', title: 'Organización y Cumplimiento', desc: 'Respetamos tu tiempo con una logística precisa y puntual.' },
                  { num: '02', title: 'Atención Cercana y Humanizada', desc: 'Te acompañamos antes, durante y después con calidez.' },
                  { num: '03', title: 'Experiencias Temáticas', desc: 'Recorridos de cultura, naturaleza, bienestar, cacao, café y más.' },
                  { num: '04', title: 'Desarrollo Local Responsable', desc: 'Generamos impacto social y económico positivo en la región.' },
                ].map((val, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 }}
                    className="flex gap-5 items-start p-5 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-bold flex-shrink-0 w-10 text-right" style={{ color: '#d1fae5', fontSize: '1.4rem' }}>
                      {val.num}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">{val.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{val.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Imagen vertical */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-3xl overflow-hidden shadow-xl"
              style={{ height: '560px' }}
            >
              <ImageWithFallback
                src="/aventura.jpg"
                alt="Experiencia de aventura Occitours"
                className="w-full h-full object-cover"
              />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          RNT — BANNER OSCURO
      ───────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Shield className="w-8 h-8" style={{ color: '#34d399' }} />
          </div>
          <h2 className="font-bold text-white mb-5" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
            Respaldo y Formalidad
          </h2>
          <p style={{ color: '#a7f3d0', fontSize: '1.05rem', lineHeight: '1.8', maxWidth: '580px', margin: '0 auto 2rem' }}>
            Operamos con total transparencia. Contamos con{' '}
            <strong className="text-white">Registro Nacional de Turismo (RNT: 250112)</strong>{' '}
            vigente — garantía de legalidad, formalidad y compromiso con tu seguridad.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.35)' }}>
            <Award className="w-5 h-5" />
            Agencia Operadora Certificada
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          CTA FINAL
      ───────────────────────────────────────── */}
      <section className="py-24 bg-white text-center">
        <div style={{ maxWidth: '620px', margin: '0 auto', padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: '#ecfdf5' }}>
              <Mountain className="w-7 h-7" style={{ color: '#059669' }} />
            </div>
            <h2 className="font-bold text-gray-900 mb-5 leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              Viaja con propósito,<br />descubre con el corazón.
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed">
              ¿Listo para vivir la magia del Occidente de Antioquia?
              Únete a nosotros y construyamos juntos recuerdos inolvidables.
            </p>
            <button
              onClick={() => onViewChange('routes')}
              className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full text-white transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)', fontSize: '1.05rem', boxShadow: '0 8px 25px rgba(5,150,105,0.35)' }}
            >
              Descubre Nuestras Experiencias
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────── */}
      <footer style={{ background: '#0f172a' }}>
        {/* Franja superior con logo y redes */}
        <div style={{ borderBottom: '1px solid #1e293b', padding: '40px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            {/* Logo + descripción */}
            <div style={{ maxWidth: '340px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mountain className="w-5 h-5 text-white" />
                </div>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>Occitours</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Agencia operadora de turismo en el Occidente de Antioquia.
                Experiencias auténticas, responsables y con sentido.
              </p>
            </div>

            {/* Redes sociales */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Síguenos</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { href: 'https://www.facebook.com/people/Occitours/61577264948801/', icon: <Facebook className="w-4 h-4" />, label: 'Facebook' },
                  { href: 'https://www.instagram.com/occitours/', icon: <Instagram className="w-4 h-4" />, label: 'Instagram' },
                  {
                    href: 'https://www.tiktok.com/@occitours',
                    label: 'TikTok',
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
                      </svg>
                    )
                  }
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#1e293b', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columnas de links */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', marginBottom: '40px' }}>

            {/* Navegación */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Navegación</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[{ l: 'Inicio', v: 'home' }, { l: 'Quiénes Somos', v: 'about' }, { l: 'Rutas', v: 'routes' }, { l: 'Fincas', v: 'farms' }].map(x => (
                  <li key={x.v}>
                    <button
                      onClick={() => onViewChange(x.v)}
                      style={{ color: '#94a3b8', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    >{x.l}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Términos y Condiciones', 'Política de Privacidad', 'Políticas de Cancelación'].map(t => (
                  <li key={t}>
                    <a href="#" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    >{t}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ayuda */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Ayuda</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Preguntas Frecuentes', 'Centro de Ayuda'].map(t => (
                  <li key={t}>
                    <a href="#" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    >{t}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Contacto</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Mail style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0, marginTop: '2px' }} />
                  <a href="mailto:Gerenciaoccitours@gmail.com"
                    style={{ color: '#94a3b8', fontSize: '0.8rem', textDecoration: 'none', wordBreak: 'break-all', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >Gerenciaoccitours@gmail.com</a>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone style={{ width: '16px', height: '16px', color: '#34d399', flexShrink: 0 }} />
                  <a href="tel:+573043898018"
                    style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#34d399')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >+57 304 3898018</a>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ color: '#475569', fontSize: '0.8rem' }}>Occitours &copy; 2025 — RNT: 250112</p>
            <p style={{ color: '#334155', fontSize: '0.8rem' }}>Agencia operadora registrada &bull; Occidente de Antioquia</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
