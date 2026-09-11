import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTeacher } from '../context/TeacherContext'
import { AnnounceBell } from './AnnounceBell'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { useI18n } from '../i18n/I18nContext'

function Icon({ name }) {
  const common = {
    className: 'nav-ico',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (name === 'chat') {
    return (
      <svg {...common}>
        <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H16a3 3 0 0 1 3 3v6.5a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13z" />
      </svg>
    )
  }
  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 1.5" />
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
  return (
    <svg {...common}>
      <path d="M4 19V6.5A1.5 1.5 0 0 1 5.5 5H20v12.5H6.2A2.2 2.2 0 0 0 4 19.7 2.2 2.2 0 0 0 6.2 22H20" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  )
}

export function Layout() {
  const { teacher, logout, announcements, inboxNotes, postAnnouncement, deleteAnnouncement } = useTeacher()
  const inbox = [...(inboxNotes || []), ...(announcements || [])].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
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
        </div>
        <nav className="nav-list" onClick={() => setOpen(false)}>
          <NavLink to="/desk" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon name="clock" />
            <span>{t('navDesk')}</span>
          </NavLink>
          <NavLink to="/classes" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon name="book" />
            <span>{t('navClasses')}</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon name="chart" />
            <span>{t('navAnalytics')}</span>
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon name="chat" />
            <span>{t('navGroups')}</span>
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="who">
            <div className="who-avatar">{(teacher.name || 'T').slice(0, 1)}</div>
            <div>
              <strong>{teacher.name}</strong>
              <span>{t('roleLine', { subject: teacher.subject || t('teacherRole') })}</span>
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
              announcements={inbox}
              user={teacher}
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
    </div>
  )
}
