export function HockeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Шайба - вид сбоку (цилиндр) */}
      <ellipse
        cx="12"
        cy="8"
        rx="7"
        ry="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M5 8L5 16C5 17.6569 8.13401 19 12 19C15.866 19 19 17.6569 19 16L19 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <ellipse
        cx="12"
        cy="16"
        rx="7"
        ry="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
