import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTeacher } from '../context/TeacherContext'
import { AnnounceBell } from './AnnounceBell'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { useI18n } from '../i18n/I18nContext'

function TabIcon({ name }) {
  const common = {
    className: 'tab-ico',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.85',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (name === 'desk') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 1.5" />
      </svg>
    )
  }
  if (name === 'classes') {
    return (
      <svg {...common}>
        <path d="M4 19V6.5A1.5 1.5 0 0 1 5.5 5H20v12.5H6.2A2.2 2.2 0 0 0 4 19.7 2.2 2.2 0 0 0 6.2 22H20" />
        <path d="M8 9h8M8 13h5" />
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
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H16a3 3 0 0 1 3 3v6.5a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13z" />
    </svg>
  )
}

function titleForPath(pathname) {
  if (pathname.startsWith('/classes/')) return 'navClasses'
  if (pathname.startsWith('/classes')) return 'navClasses'
  if (pathname.startsWith('/analytics')) return 'navAnalytics'
  if (pathname.startsWith('/groups')) return 'navGroups'
  if (pathname.startsWith('/desk')) return 'navDesk'
  return 'brand'
}

export function Layout() {
  const { teacher, announcements, inboxNotes, postAnnouncement, deleteAnnouncement } = useTeacher()
  const inbox = [...(inboxNotes || []), ...(announcements || [])].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  )
  const { t } = useI18n()
  const location = useLocation()
  const titleKey = titleForPath(location.pathname)
  const inClass = location.pathname.startsWith('/classes/')

  return (
    <div className="phone-stage">
      <div className="phone-app">
        <header className="app-topbar">
          <div className="app-topbar-text">
            <p className="app-kicker">{t('school')}</p>
            <h1>{t(titleKey)}</h1>
          </div>
          <div className="app-topbar-actions">
            <LanguageToggle compact />
            <AnnounceBell
              announcements={inbox}
              user={teacher}
              canPost
              onPost={postAnnouncement}
              onDelete={deleteAnnouncement}
            />
          </div>
        </header>

        <main className="app-body">
          <Outlet />
        </main>

        <nav className={`tab-bar tabs-4${inClass ? ' is-hidden' : ''}`} aria-label={t('menu')}>
          <NavLink to="/desk" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="desk" />
            <span>{t('tabDesk')}</span>
          </NavLink>
          <NavLink
            to="/classes"
            className={({ isActive }) => `tab-item${isActive || inClass ? ' on' : ''}`}
          >
            <TabIcon name="classes" />
            <span>{t('tabClasses')}</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="chart" />
            <span>{t('tabAnalytics')}</span>
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="chat" />
            <span>{t('tabGroups')}</span>
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
