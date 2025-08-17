import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function EmailExpiredPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Implement resend verification logic here
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSent(true)
    } catch (err: any) {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="mx-auto h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-check text-2xl text-green-500"></i>
            </div>
            <h2 className="text-3xl font-bold">Email Sent!</h2>
            <p className="mt-2 text-muted-foreground">
              We've sent a new verification email to {email}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">
              Please check your email and click the verification link. The new link will be valid for 24 hours.
            </p>
          </div>

          <Link to="/login" className="btn-primary">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-clock text-2xl text-destructive"></i>
          </div>
          <h2 className="text-3xl font-bold">Verification Link Expired</h2>
          <p className="mt-2 text-muted-foreground">
            Your email verification link has expired. Don't worry, we can send you a new one!
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              The verification link you clicked has expired for security reasons.
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Verification links expire after 24 hours</p>
              <p>• This helps keep your account secure</p>
              <p>• You can request a new verification email below</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleResendVerification} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="loading-spinner mr-2 h-4 w-4"></div>
                Sending New Link...
              </span>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Send New Verification Email
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link to="/login" className="text-primary hover:text-primary/80 font-medium block">
            Back to Login
          </Link>
          <Link to="/signup" className="text-muted-foreground hover:text-foreground text-sm">
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  )
}