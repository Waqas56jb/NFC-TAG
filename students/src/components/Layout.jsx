import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useStudent } from '../context/StudentContext'
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
  if (name === 'profile') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.4-3.2 3.8-4.6 7-4.6s5.6 1.4 7 4.6" />
      </svg>
    )
  }
  if (name === 'attend') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    )
  }
  if (name === 'leave') {
    return (
      <svg {...common}>
        <path d="M9 4h6a2 2 0 0 1 2 2v14l-5-2.5L7 20V6a2 2 0 0 1 2-2z" />
        <path d="M10 9h4M10 13h4" />
      </svg>
    )
  }
  if (name === 'work') {
    return (
      <svg {...common}>
        <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M4 12h16" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H16a3 3 0 0 1 3 3v6.5a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13z" />
    </svg>
  )
}

const titles = {
  '/profile': 'navProfile',
  '/attendance': 'navAttendance',
  '/leave': 'navLeave',
  '/assignments': 'navHomework',
  '/groups': 'navGroups',
}

export function Layout() {
  const { student, announcements, inboxNotes, homeworkUnread } = useStudent()
  const { t } = useI18n()
  const location = useLocation()
  const titleKey = titles[location.pathname] || 'brand'
  const inbox = useMemo(
    () =>
      [...(inboxNotes || []), ...(announcements || [])].sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
      ),
    [inboxNotes, announcements],
  )

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
            <AnnounceBell announcements={inbox} user={student} canPost={false} />
          </div>
        </header>

        <main className="app-body">
          <Outlet />
        </main>

        <nav className="tab-bar tabs-5" aria-label={t('menu')}>
          <NavLink to="/profile" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="profile" />
            <span>{t('tabProfile')}</span>
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="attend" />
            <span>{t('tabAttend')}</span>
          </NavLink>
          <NavLink to="/leave" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="leave" />
            <span>{t('tabLeave')}</span>
          </NavLink>
          <NavLink to="/assignments" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="work" />
            <span>{t('tabHomework')}</span>
            {homeworkUnread ? <i className="tab-badge">{homeworkUnread > 9 ? '9+' : homeworkUnread}</i> : null}
          </NavLink>
          <NavLink to="/groups" className={({ isActive }) => `tab-item${isActive ? ' on' : ''}`}>
            <TabIcon name="chat" />
            <span>{t('tabGroup')}</span>
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
