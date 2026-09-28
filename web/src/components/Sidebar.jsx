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

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B7A6FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="8"></rect>
      <rect x="10" y="7" width="4" height="13"></rect>
      <rect x="17" y="3" width="4" height="17"></rect>
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
        background: 'linear-gradient(135deg, #7C5CFC, #B7A6FF)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D0F12" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
          color: '#5A5D68',
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
            background: '#1B1D23',
            border: '1px solid #2A2D35',
            borderRadius: 6,
            padding: '5px 9px',
            fontSize: 11.5,
            color: '#ECEBF2',
            whiteSpace: 'nowrap',
            zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '10px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        background: active ? 'rgba(124,92,252,0.14)' : 'transparent',
        color: active ? '#ECEBF2' : '#9497A3',
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      {active && (
        <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: '#7C5CFC' }} />
      )}
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
    <div style={{ padding: '14px 12px 4px 12px', fontSize: 10.5, color: '#5A5D68', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
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
        background: '#131519',
        borderRight: '1px solid #22242B',
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
          borderBottom: '1px solid #22242B',
          marginBottom: 8,
        }}
      >
        <LogoMark />
        {!collapsed && <div className="disp" style={{ fontSize: 17, fontWeight: 600 }}>E-Voucher</div>}
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
          color: '#6B6E7A',
        }}
      >
        <ChevronIcon collapsed={collapsed} />
        {!collapsed && <span style={{ fontSize: 11.5 }}>Collapse</span>}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: collapsed ? '0 12px' : '0 12px' }}>
        <NavItem
          to="/"
          icon={<OverviewIcon />}
          label="Overview"
          collapsed={collapsed}
          active={location.pathname === '/'}
        />

        <SectionLabel collapsed={collapsed}>By payment behaviour</SectionLabel>
        <NavItem
          to="/corporate-sales"
          dotColor="#5CC8FC"
          label="Corporate Sales"
          collapsed={collapsed}
          active={location.pathname === '/corporate-sales'}
        />
        <NavItem
          to="/kotak"
          dotColor="#F2B84B"
          label="Kotak"
          collapsed={collapsed}
          active={location.pathname === '/kotak'}
        />
        <NavItem
          to="/offers"
          dotColor="#7C5CFC"
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
          borderTop: '1px solid #22242B',
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
            color: '#6B6E7A',
            fontSize: 11.5,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', flexShrink: 0 }} />
          {!collapsed && 'Data synced'}
        </div>
      </div>
    </nav>
  )
}
