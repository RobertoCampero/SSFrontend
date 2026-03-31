import { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorMap = {
  blue: { icon: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100', accent: 'from-blue-600 to-blue-400' },
  green: { icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100', accent: 'from-emerald-600 to-emerald-400' },
  purple: { icon: 'bg-purple-50 text-purple-600 ring-1 ring-purple-100', accent: 'from-purple-600 to-purple-400' },
  orange: { icon: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100', accent: 'from-orange-600 to-orange-400' },
  red: { icon: 'bg-red-50 text-red-600 ring-1 ring-red-100', accent: 'from-red-600 to-red-400' },
}

export function StatsCard({ title, value, icon: Icon, change, changeType = 'neutral', color = 'blue' }: StatsCardProps) {
  return (
    <div className="card p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={clsx(
              'text-xs font-medium',
              changeType === 'positive' && 'text-emerald-600',
              changeType === 'negative' && 'text-red-600',
              changeType === 'neutral' && 'text-gray-400',
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={clsx('rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-110', colorMap[color].icon)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
