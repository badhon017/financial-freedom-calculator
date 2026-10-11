type IconName =
  | 'user'
  | 'wallet'
  | 'cart'
  | 'inflation'
  | 'bank'
  | 'flag'
  | 'calendar'
  | 'spark'
  | 'scale'
  | 'route'
  | 'table'
  | 'shield'
  | 'percent'
  | 'wave'
  | 'heart'
  | 'arrowDown'

/** 1.5px stroke, 24px grid — quiet enough to sit beside a heading. */
const PATHS: Record<IconName, string> = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  wallet: 'M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2m-16 0v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3m-3-3h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4Z',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6M9 21h.01M17 21h.01',
  inflation: 'M3 17 9 11l4 4 8-8M15 7h6v6',
  bank: 'M3 10 12 4l9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18',
  flag: 'M5 21V4m0 0 5.5 2.5L16 4l3 1.5V14l-3-1.5-5.5 2.5L5 12.5',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  spark: 'm12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z',
  scale: 'M12 4v16M7 8H4l3 6 3-6H7Zm10 0h-3l3 6 3-6h-3ZM6 20h12',
  route: 'M7 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm10 11a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM7 9v3a3 3 0 0 0 3 3h4a3 3 0 0 1 3 3',
  table: 'M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Zm0 4h16M10 10v9',
  shield: 'M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6l-7-3Z',
  percent: 'M19 5 5 19M7.5 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm9 9a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z',
  wave: 'M3 12c2.5-4 4.5-4 7 0s4.5 4 7 0M3 18c2.5-4 4.5-4 7 0s4.5 4 7 0M3 6c2.5-4 4.5-4 7 0s4.5 4 7 0',
  heart: 'M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z',
  arrowDown: 'M12 5v14m0 0-5-5m5 5 5-5',
}

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={'h-full w-full ' + className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export type { IconName }
