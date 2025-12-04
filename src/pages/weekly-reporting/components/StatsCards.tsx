import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card'
import React from 'react'

interface StatsCardsProps {
    title: string
    icon?: React.ReactNode
    value: number | string
}

const StatsCards = ({ title, icon, value }: StatsCardsProps) => {
  return (
    <Card className="bg-gradient-to-br from-background via-muted/15 to-primary/3 hover:shadow-md border border-border hover:border-primary/10 transition-all duration-300 group hover:scale-102">
        <div className="flex items-center justify-between p-6">
            <div className="w-full flex items-center gap-2 justify-between">
                <h2 className="text-md font-semibold">
                    {title}
                </h2>
                <div className="text-xl font-semibold">
                    {value}
                </div>
            </div>
        </div>
    </Card>
  )
}

export default StatsCards