import * as React from 'react'
import clsx from 'clsx'
export function Card(props:React.HTMLAttributes<HTMLDivElement>){ return <div className={clsx('rounded-2xl border bg-white shadow-sm', props.className)} {...props}/> }
export function CardHeader(props:React.HTMLAttributes<HTMLDivElement>){ return <div className={clsx('p-4 border-b', props.className)} {...props}/> }
export function CardTitle(props:React.HTMLAttributes<HTMLHeadingElement>){ return <h2 className={clsx('text-lg font-semibold', props.className)} {...props}/> }
export function CardContent(props:React.HTMLAttributes<HTMLDivElement>){ return <div className={clsx('p-4', props.className)} {...props}/> }