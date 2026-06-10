'use client'

const LOGO_SRC = '/tablefor-logo.png'

export default function TableForBrand({
  size = 'sm',
  layout = 'inline',
  showTagline = false,
  titleClassName = '',
  className = '',
}) {
  const iconClass =
    size === 'lg' ? 'h-14 w-14 lg:h-16 lg:w-16' : 'h-7 w-7'
  const defaultTitle =
    size === 'lg'
      ? 'text-xl font-bold text-text-primary tracking-tight lg:text-2xl'
      : 'text-base font-bold text-text-primary'
  const stacked = layout === 'stacked'

  return (
    <div
      className={`flex ${stacked ? 'flex-col items-center text-center gap-2' : 'items-center gap-2.5'} ${className}`}
    >
      <img
        src={LOGO_SRC}
        alt=""
        className={`${iconClass} shrink-0 object-contain`}
        width={size === 'lg' ? 64 : 28}
        height={size === 'lg' ? 64 : 28}
      />
      <div className={stacked ? '' : 'min-w-0'}>
        <span className={titleClassName || defaultTitle}>TableFor</span>
        {showTagline && (
          <p className="mt-0.5 text-sm text-text-secondary">Group Dining Agent</p>
        )}
      </div>
    </div>
  )
}
