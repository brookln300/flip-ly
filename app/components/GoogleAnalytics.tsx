'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { getConsent } from '../lib/consent'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID

export default function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false)

  // Capture gclid/fbclid/msclkid on landing for ad attribution
  // This uses first-party sessionStorage, not cookies — runs regardless of consent
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const gclid = params.get('gclid')
    const fbclid = params.get('fbclid')
    const msclkid = params.get('msclkid')
    if (gclid) sessionStorage.setItem('fliply_gclid', gclid)
    if (fbclid) sessionStorage.setItem('fliply_fbclid', fbclid)
    if (msclkid) sessionStorage.setItem('fliply_msclkid', msclkid)
  }, [])

  // Check cookie consent status
  useEffect(() => {
    setConsentGiven(getConsent() === 'accepted')
  }, [])

  if (!GA_MEASUREMENT_ID || !consentGiven) return null

  return (
    <>
      {/* GA4 */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : '// Google Ads ID not configured yet'}
        `}
      </Script>

      {/* Facebook Pixel — fires when NEXT_PUBLIC_FB_PIXEL_ID is set */}
      {FB_PIXEL_ID && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  )
}

/**
 * Client-side conversion tracking helpers.
 * Call these from onClick handlers or after key actions.
 * They no-op gracefully if the pixel isn't loaded.
 */

// Google Ads conversion — call after signup or purchase
export function trackGoogleAdsConversion(conversionLabel: string, value?: number) {
  if (typeof window === 'undefined' || !GOOGLE_ADS_ID) return
  const w = window as any
  if (typeof w.gtag !== 'function') return
  w.gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${conversionLabel}`,
    ...(value ? { value, currency: 'USD' } : {}),
  })
}

// Facebook conversion — call after signup or purchase
export function trackFBConversion(event: string, params?: Record<string, any>) {
  if (typeof window === 'undefined' || !FB_PIXEL_ID) return
  const w = window as any
  if (typeof w.fbq !== 'function') return
  w.fbq('track', event, params)
}

// GA4 client-side event (supplements server-side trackEvent)
export function trackGA4Event(event: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return
  const w = window as any
  if (typeof w.gtag !== 'function') return
  w.gtag('event', event, params)
}
