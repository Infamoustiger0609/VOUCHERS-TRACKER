import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const STORAGE_KEY = 'evoucher.sidebarCollapsed'

function readStoredCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function ChevronIcon({ collapsed }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

function ExpiryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v5l3.2 2"></path>
    </svg>
  )
}

function DataHealthIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4"></path>
      <path d="M12 17h.01"></path>
      <path d="M10.3 3.9L2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>
    </svg>
  )
}

function LogoMark() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: 'linear-gradient(135deg, var(--sidebar-active), #b08968)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="6" width="16" height="12" rx="2"></rect>
        <path d="M4 10h16"></path>
      </svg>
    </div>
  )
}

/** A disabled nav row with a hover tooltip - "Coming in a later phase". */
function DisabledNavItem({ icon, dotColor, label, collapsed }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        aria-disabled="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '10px 0' : '10px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 8,
          color: 'var(--text-faint)',
          cursor: 'not-allowed',
          userSelect: 'none',
        }}
      >
        {dotColor ? (
          <span style={{ width: 8, height: 8, borderRadius: 2, background: dotColor, flexShrink: 0, opacity: 0.55 }} />
        ) : (
          <span style={{ flexShrink: 0, opacity: 0.6 }}>{icon}</span>
        )}
        {!collapsed && <span style={{ fontSize: 13.5 }}>{label}</span>}
      </div>

      {hovered && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: collapsed ? '100%' : 12,
            top: collapsed ? '50%' : '100%',
            transform: collapsed ? 'translateY(-50%) translateX(8px)' : 'translateY(4px)',
            background: 'var(--text-primary)',
            border: 'none',
            borderRadius: 6,
            padding: '5px 9px',
            fontSize: 11.5,
            color: 'var(--bg-card)',
            whiteSpace: 'nowrap',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          Coming in a later phase
        </div>
      )}
    </div>
  )
}

/** An enabled nav row - a real route, highlighted when active. */
function NavItem({ to, icon, dotColor, label, collapsed, active }) {
  return (
    <Link
      to={to}
      className="eh-nav-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '10px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        background: active ? 'var(--sidebar-active)' : undefined,
        color: active ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)',
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      {dotColor ? (
        <span style={{ width: 8, height: 8, borderRadius: 2, background: dotColor, flexShrink: 0 }} />
      ) : (
        <span style={{ flexShrink: 0 }}>{icon}</span>
      )}
      {!collapsed && <span style={{ fontSize: 13.5, fontWeight: active ? 500 : 400 }}>{label}</span>}
    </Link>
  )
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div style={{ height: 14 }} />
  return (
    <div style={{ padding: '14px 12px 4px 12px', fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {children}
    </div>
  )
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed)
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore - localStorage may be unavailable (private mode, etc.)
    }
  }, [collapsed])

  const width = collapsed ? 72 : 232

  return (
    <nav
      aria-label="Primary"
      style={{
        width,
        height: '100%',
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        transition: 'width 150ms ease',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '0 0 24px 0' : '0 20px 24px 20px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--border-light)',
          marginBottom: 8,
        }}
      >
        <LogoMark />
        {!collapsed && <div className="disp" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>E-Voucher</div>}
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 8,
          padding: collapsed ? '6px 0 14px 0' : '0 20px 14px 20px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
        }}
      >
        <ChevronIcon collapsed={collapsed} />
        {!collapsed && <span style={{ fontSize: 11.5 }}>Collapse</span>}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: collapsed ? '0 12px' : '0 12px' }}>
        <NavItem
          to="/"
          dotColor="var(--kpi-overall)"
          label="Overview"
          collapsed={collapsed}
          active={location.pathname === '/'}
        />

        <SectionLabel collapsed={collapsed}>By payment behaviour</SectionLabel>
        <NavItem
          to="/corporate-sales"
          dotColor="var(--kpi-corporate-sales)"
          label="Corporate Sales"
          collapsed={collapsed}
          active={location.pathname === '/corporate-sales'}
        />
        <NavItem
          to="/kotak"
          dotColor="var(--kpi-kotak)"
          label="Kotak"
          collapsed={collapsed}
          active={location.pathname === '/kotak'}
        />
        <NavItem
          to="/offers"
          dotColor="var(--kpi-offers)"
          label="Offers (On Redemption)"
          collapsed={collapsed}
          active={location.pathname === '/offers'}
        />

        <SectionLabel collapsed={collapsed}>Other views</SectionLabel>
        <DisabledNavItem icon={<ExpiryIcon />} label="Expiry & Risk" collapsed={collapsed} />
        <DisabledNavItem icon={<DataHealthIcon />} label="Data Health" collapsed={collapsed} />
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: collapsed ? '12px 0 0 0' : '12px 20px 0 20px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          title="Data synced"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 11.5,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
          {!collapsed && 'Data synced'}
        </div>
      </div>
    </nav>
  )
}
