import * as React from 'react'
import clsx from 'clsx'
export function Label(props:React.LabelHTMLAttributes<HTMLLabelElement>){ return <label className={clsx('text-sm font-medium', props.className)} {...props}/> }