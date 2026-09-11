/** Round chat icon button for 1:1 student DMs */
export function ChatIconButton({ onClick, label, className = '' }) {
  return (
    <button
      type="button"
      className={`icon-chat ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h10v2H7V9zm0-3h10v2H7V6zm0 6h7v2H7v-2z"
        />
      </svg>
    </button>
  )
}
