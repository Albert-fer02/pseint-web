import type * as React from 'react'
import { cn } from '@/shared/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border/90 bg-card text-card-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_10px_30px_rgba(2,6,23,0.06)] transition-shadow duration-200 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_16px_40px_rgba(2,6,23,0.10)]',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 px-4 pt-4 md:px-5 md:pt-5', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 className={cn('text-base font-semibold tracking-tight md:text-lg', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-4 pb-4 md:px-5 md:pb-5', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center px-4 pb-4 md:px-5 md:pb-5', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
