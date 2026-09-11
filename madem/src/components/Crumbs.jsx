import { Link } from 'react-router-dom'

export function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="crumb" key={`${item.label}-${index}`}>
          {index > 0 ? <span className="crumb-sep">/</span> : null}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span className="crumb-now">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
