import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { AnnounceBell } from './AnnounceBell'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { useI18n } from '../i18n/I18nContext'

const links = [
  { to: '/', labelKey: 'navOverview', end: true, icon: 'grid' },
  { to: '/teachers', labelKey: 'navTeachers', icon: 'user' },
  { to: '/classes', labelKey: 'navClasses', icon: 'book' },
  { to: '/analytics', labelKey: 'navAnalytics', icon: 'chart' },
  { to: '/groups', labelKey: 'navGroups', icon: 'chat' },
  { to: '/sub-users', labelKey: 'navSubUsers', madamOnly: true, icon: 'users' },
  { to: '/activity', labelKey: 'navActivity', madamOnly: true, icon: 'clock' },
  { to: '/account', labelKey: 'navAccount', madamOnly: true, icon: 'cog' },
]

function Icon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'nav-ico',
    'aria-hidden': true,
  }
  if (name === 'grid') {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
      </svg>
    )
  }
  if (name === 'user') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19.2c1.2-3.2 3.6-4.7 7-4.7s5.8 1.5 7 4.7" />
      </svg>
    )
  }
  if (name === 'book') {
    return (
      <svg {...common}>
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16.5H7.5A2.5 2.5 0 0 0 5 22z" />
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 8H20" />
      </svg>
    )
  }
  if (name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.8" />
        <path d="M3.8 18.5c.9-2.7 2.8-4 5.2-4s4.3 1.3 5.2 4" />
        <circle cx="16.5" cy="8.5" r="2.3" />
        <path d="M15 14.6c1.8.2 3.3 1.2 4.2 3.4" />
      </svg>
    )
  }
  if (name === 'chat') {
    return (
      <svg {...common}>
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H16a3 3 0 0 1 3 3v6.5a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13z" />
      </svg>
    )
  }
  if (name === 'chart') {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <rect x="6" y="11" width="3" height="6" rx="0.8" />
        <rect x="10.5" y="7" width="3" height="10" rx="0.8" />
        <rect x="15" y="9" width="3" height="8" rx="0.8" />
      </svg>
    )
  }
  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.2v1.8M12 18v1.8M4.2 12h1.8M18 12h1.8M6.4 6.4l1.3 1.3M16.3 16.3l1.3 1.3M17.6 6.4l-1.3 1.3M7.7 16.3l-1.3 1.3" />
    </svg>
  )
}

export function Layout() {
  const { user, isMadam, logout, toast, announcements, postAnnouncement, deleteAnnouncement } = useApp()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      {open ? <button className="sidebar-backdrop" aria-label={t('closeMenu')} onClick={() => setOpen(false)} /> : null}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <h1>{t('brand')}</h1>
            <p>{t('school')}</p>
          </div>
          <button className="ghost sidebar-close" onClick={() => setOpen(false)} aria-label={t('closeMenu')}>
            ✕
          </button>
        </div>
        <nav className="nav-list" onClick={() => setOpen(false)}>
          {links
            .filter((link) => !link.madamOnly || isMadam)
            .map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon name={link.icon} />
                <span>{t(link.labelKey)}</span>
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <div className="who-avatar">{(user.name || 'M').slice(0, 1)}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{isMadam ? t('roleMadam') : t('roleSub')}</span>
            </div>
          </div>
          <LanguageToggle />
          <button className="ghost signout" onClick={logout}>
            {t('signOut')}
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="main-head">
          <div className="mobile-bar">
            <button className="ghost menu-btn" onClick={() => setOpen(true)} aria-label={t('menu')}>
              <span className="burger" />
              {t('menu')}
            </button>
            <strong>{t('brand')}</strong>
          </div>
          <div className="head-actions">
            <AnnounceBell
              announcements={announcements}
              user={user}
              canPost
              onPost={postAnnouncement}
              onDelete={deleteAnnouncement}
            />
          </div>
        </div>
        <div className="page">
          <Outlet />
        </div>
      </div>
      {toast ? <div className={`toast ${toast.tone === 'bad' ? 'bad' : ''}`}>{toast.message}</div> : null}
    </div>
  )
}
