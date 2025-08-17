import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function EmailVerificationPage() {
  const location = useLocation()
  const email = location.state?.email || 'your email'
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleResendEmail = () => {
    // Implement resend logic here
    setCountdown(60)
    setCanResend(false)
    // Show success message
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-envelope text-2xl text-primary"></i>
          </div>
          <h2 className="text-3xl font-bold">Check Your Email</h2>
          <p className="mt-2 text-muted-foreground">
            We've sent a verification email to
          </p>
          <p className="text-primary font-medium">{email}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-md">
              <i className="fas fa-info-circle mr-2"></i>
              Please check your email and click the verification link to activate your account.
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Check your spam/junk folder if you don't see the email</p>
              <p>• The verification link will expire in 24 hours</p>
              <p>• You'll be automatically redirected to login after verification</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            {!canResend ? (
              <p className="text-sm text-muted-foreground">
                Resend email in {countdown} seconds
              </p>
            ) : (
              <button
                onClick={handleResendEmail}
                className="btn-primary"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Resend Verification Email
              </button>
            )}
          </div>

          <div className="text-center">
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
              Back to Login
            </Link>
          </div>
        </div>

        <div className="bg-muted/20 border border-border rounded-lg p-4">
          <h4 className="font-medium mb-2">Having trouble?</h4>
          <p className="text-sm text-muted-foreground">
            If you're not receiving our emails, please contact our support team at{' '}
            <a href="mailto:support@bitinvested.com" className="text-primary hover:text-primary/80">
              support@bitinvested.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}