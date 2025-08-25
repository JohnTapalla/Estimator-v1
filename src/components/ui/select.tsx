import * as React from 'react'
import * as RS from '@radix-ui/react-select'
import clsx from 'clsx'
export const Select = RS.Root
export const SelectValue = RS.Value
export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof RS.Trigger>>(({ className, children, ...props }, ref) => (
  <RS.Trigger ref={ref} className={clsx('inline-flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm', className)} {...props}>{children}</RS.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'
export const SelectContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof RS.Content>>(({ className, children, ...props }, ref) => (
  <RS.Portal><RS.Content ref={ref} className={clsx('z-50 overflow-hidden rounded-md border bg-white shadow-md', className)} {...props}><RS.Viewport className='p-1'>{children}</RS.Viewport></RS.Content></RS.Portal>
))
SelectContent.displayName = 'SelectContent'
export const SelectItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof RS.Item>>(({ className, children, ...props }, ref) => (
  <RS.Item ref={ref} className={clsx('relative flex w-full cursor-pointer select-none items-center rounded px-3 py-2 text-sm outline-none hover:bg-gray-50 focus:bg-gray-50', className)} {...props}><RS.ItemText>{children}</RS.ItemText></RS.Item>
))
SelectItem.displayName = 'SelectItem'