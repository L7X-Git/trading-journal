import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import {
  Brain,
  LayoutDashboard,
  List,
  PlusCircle,
  TrendingUp,
  Wallet,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: List },
  { name: 'Add Trade', href: '/add-trade', icon: PlusCircle },
  { name: 'Strategies', href: '/settings/strategies', icon: Brain },
  { name: 'Accounts', href: '/settings/accounts', icon: Wallet },
]

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Navigation */}
      <nav className="bg-card/80 shadow-sm border-b border-border backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <TrendingUp className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-foreground">Trading Journal</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        location.pathname.startsWith(item.href)
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors'
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  )
}
