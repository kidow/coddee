import type { FC } from 'react'
import classnames from 'classnames'
import type { Argument } from 'classnames'

export interface Props {
  className?: Argument
}

const Spinner: FC<Props> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={classnames('opacity-25', className)}
      width="200px"
      height="200px"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
    >
      <path
        d="M82 50A32 32 0 1 1 23.533421623214014 32.01333190873183 L21.71572875253809 21.7157287525381 L32.013331908731814 23.53342162321403 A32 32 0 0 1 82 50"
        stroke-width="5"
        stroke="#000"
        fill="none"
      ></path>
      <circle
        cx="50"
        cy="50"
        r="20"
        stroke-width="5"
        stroke="#000"
        stroke-dasharray="31.41592653589793 31.41592653589793"
        fill="none"
        stroke-linecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          repeatCount="indefinite"
          dur="1s"
          keyTimes="0;1"
          values="0 50 50;360 50 50"
        ></animateTransform>
      </circle>
    </svg>
  )
}

export default Spinner
