import * as React from 'react'
import clsx from 'clsx'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={clsx('w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-gray-400', className)} {...props} />
))
Input.displayName = 'Input'