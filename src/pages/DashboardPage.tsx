import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [btcBalance, setBtcBalance] = useState('0.00000000')
  const [usdBalance, setUsdBalance] = useState('0.00')
  const [btcPrice, setBtcPrice] = useState('0.00')
  const [walletAddress, setWalletAddress] = useState('Loading...')
  const [showFullAddress, setShowFullAddress] = useState(false)
  const [withdrawTimer, setWithdrawTimer] = useState({ hours: 24, minutes: 0, seconds: 0 })

  useEffect(() => {
    // Load mock data
    loadDashboardData()
    startCountdownTimer()
  }, [])

  const loadDashboardData = () => {
    // Mock data - replace with real API calls
    setBtcBalance('0.05432100')
    setUsdBalance('2,456.78')
    setBtcPrice('45,234.56')
    setWalletAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
  }

  const startCountdownTimer = () => {
    const interval = setInterval(() => {
      setWithdrawTimer(prev => {
        let { hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        }
        
        return { hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(interval)
  }

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    // Show toast notification
  }

  const toggleAddressDisplay = () => {
    setShowFullAddress(!showFullAddress)
  }

  const displayAddress = showFullAddress 
    ? walletAddress 
    : `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="bitcoin-icon text-3xl">₿</span>
                BitInvested Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.user_metadata?.first_name || 'Investor'}
              </p>
            </div>
            <button
              onClick={signOut}
              className="btn-secondary flex items-center gap-2"
            >
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Balance Card */}
          <div className="card btc-glow">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bitcoin-icon">₿</span>
                Bitcoin Balance
              </h3>
              <button className="btn-secondary p-2">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {btcBalance} <span className="text-lg">BTC</span>
                  </div>
                  <div className="text-muted-foreground">
                    ≈ ${usdBalance} USD
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address:</label>
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                    <span className="text-sm font-mono flex-1 truncate">
                      {displayAddress}
                    </span>
                    <button
                      onClick={copyWalletAddress}
                      className="btn-secondary p-1"
                      title="Copy Address"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                    <button
                      onClick={toggleAddressDisplay}
                      className="btn-secondary p-1"
                      title="Toggle Full Address"
                    >
                      <i className={`fas ${showFullAddress ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn-primary flex-1">
                    <i className="fas fa-plus mr-2"></i>
                    Fund Account
                  </button>
                  <button 
                    className="btn-secondary flex-1" 
                    disabled={withdrawTimer.hours > 0 || withdrawTimer.minutes > 0 || withdrawTimer.seconds > 0}
                  >
                    <i className="fas fa-minus mr-2"></i>
                    Withdraw
                    {(withdrawTimer.hours > 0 || withdrawTimer.minutes > 0 || withdrawTimer.seconds > 0) && (
                      <span className="ml-2 text-xs">
                        {String(withdrawTimer.hours).padStart(2, '0')}:
                        {String(withdrawTimer.minutes).padStart(2, '0')}:
                        {String(withdrawTimer.seconds).padStart(2, '0')}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Price Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fas fa-chart-line"></i>
                Live BTC Price
              </h3>
              <button className="btn-secondary p-2">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="card-content">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">
                  ${btcPrice}
                </div>
                <div className="text-green-500 text-sm">
                  +2.34% (+$1,045.67)
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                  <div>
                    <div className="text-muted-foreground">24h High</div>
                    <div className="font-semibold">$46,789.12</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">24h Low</div>
                    <div className="font-semibold">$44,123.45</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Timer Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fas fa-clock"></i>
                Withdrawal Timer
              </h3>
            </div>
            <div className="card-content">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {String(withdrawTimer.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {String(withdrawTimer.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {String(withdrawTimer.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Seconds</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time until withdrawal eligibility
                </p>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${((24 - withdrawTimer.hours) / 24) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fas fa-life-ring"></i>
                Support Center
              </h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="font-semibold">Live Agents Available</div>
                    <div className="text-sm text-muted-foreground">
                      Average response time: 2 minutes
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1">
                    <i className="fas fa-comments mr-2"></i>
                    Start Chat
                  </button>
                  <button className="btn-secondary flex-1">
                    <i className="fas fa-question-circle mr-2"></i>
                    FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card md:col-span-2">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="fas fa-history"></i>
                Recent Transactions
              </h3>
              <button className="btn-secondary p-2">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-arrow-down text-sm"></i>
                    </div>
                    <div>
                      <div className="font-semibold">Deposit</div>
                      <div className="text-sm text-muted-foreground">Jan 15, 2024</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-500">+0.01234567 BTC</div>
                    <div className="text-sm text-muted-foreground">$567.89</div>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground py-4">
                  <i className="fas fa-clock mb-2"></i>
                  <p>No recent transactions</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2024 BitInvested. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <i className="fas fa-shield-alt"></i>
              Your funds are secured with enterprise-grade encryption
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}