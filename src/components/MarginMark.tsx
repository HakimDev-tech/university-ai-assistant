import type { SVGProps } from 'react'

type MarginMarkProps = SVGProps<SVGSVGElement> & {
  size?: number
  inverted?: boolean
}

export default function MarginMark({ size = 36, inverted = false, ...props }: MarginMarkProps) {
  const paper = inverted ? '#171B22' : '#FBFAF6'
  const ink = inverted ? '#FBFAF6' : '#171B22'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      role="img"
      aria-label="Margin mark"
      {...props}
    >
      <rect x="1" y="1" width="42" height="42" fill={inverted ? '#FBFAF6' : '#2455E8'} />
      <path d="M11 7.5H26.5L33 14V36.5H11V7.5Z" fill={paper} stroke={ink} strokeWidth="1.25" />
      <path d="M26.5 7.5V14H33" stroke={ink} strokeWidth="1.25" />
      <path d="M16.5 17V31.5" stroke="#2455E8" strokeWidth="2" />
      <path d="M21 19H28M21 23.5H28M21 28H26" stroke={ink} strokeWidth="1.25" strokeLinecap="square" />
      <path d="M14.5 33.5H19" stroke="#E85B43" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  )
}
