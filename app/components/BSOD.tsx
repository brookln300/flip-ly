'use client'

import { useState, useEffect } from 'react'

export default function BSOD() {
  const [triggered, setTriggered] = useState(false)
  const [showReboot, setShowReboot] = useState(false)

  useEffect(() => {
    if (triggered) {
      // After 5 seconds, show "reboot" option
      const t = setTimeout(() => setShowReboot(true), 5000)
      return () => clearTimeout(t)
    }
  }, [triggered])

  if (!triggered) {
    // Hidden 3x3 pixel trigger zone — bottom-right corner of page
    return (
      <div
        onClick={() => setTriggered(true)}
        className="fixed bottom-0 right-0 z-[200] cursor-default"
        style={{ width: '6px', height: '6px', opacity: 0 }}
        title=""
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-start p-12 md:p-20 cursor-default" style={{
      background: '#0000AA',
      fontFamily: '"Lucida Console", "Courier New", monospace',
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#AAAAAA',
    }} onClick={() => showReboot && setTriggered(false)}>
      <div className="max-w-2xl">
        <p className="mb-6" style={{ color: '#FFFFFF', background: '#AA0000', display: 'inline-block', padding: '2px 12px' }}>
          Windows
        </p>

        <p className="mb-4" style={{ color: '#FFFFFF' }}>
          A fatal exception 0x0000DEAL has occurred at 0028:C001D069 in VxD FLIPLY(01) +
          00004269. The current application will be terminated.
        </p>

        <p className="mb-4">
          *  Press any key to return to your garage sale deals, or
        </p>

        <p className="mb-4">
          *  Press CTRL+ALT+DEL to restart your flipping career.
          You will lose all unsaved deals in all applications.
        </p>

        <p className="mb-6">
          Press any key to continue _<span className="blink">█</span>
        </p>

        <div className="mb-4" style={{ color: '#FFFFFF', fontSize: '11px' }}>
          <p>FLIPLY_FATAL_ERROR</p>
          <p>STOP: 0x0000DEAL (0x00000069, 0x00004200, 0x0000CAFE, 0xDEADBEEF)</p>
          <p>BARGAIN.SYS - Address F7B7C16E base at F7B7C000, DateStamp 1999</p>
        </div>

        <div style={{ borderTop: '1px solid #555', paddingTop: '12px', marginTop: '20px' }}>
          <p style={{ color: '#AAAAAA', fontSize: '11px' }}>
            Technical information:
          </p>
          <p style={{ fontSize: '10px', color: '#777' }}>
            *** STOP: 0x0000DEAL (You found the easter egg. Nice.)
          </p>
          <p style={{ fontSize: '10px', color: '#777' }}>
            *** flip-ly.net - Built by someone who thinks Comic Sans is a valid font choice
          </p>
          <p style={{ fontSize: '10px', color: '#777' }}>
            *** Total garage sales scraped: 69,420
          </p>
          <p style={{ fontSize: '10px', color: '#555', marginTop: '8px' }}>
            Memory dump: ████████████████████ 100% complete
          </p>
          <p style={{ fontSize: '10px', color: '#555' }}>
            Contact your system administrator or visit flip-ly.net for help.
          </p>
        </div>

        {showReboot && (
          <div className="mt-8 blink" style={{ color: '#FFFFFF', fontSize: '16px' }}>
            <p>[ Click anywhere to reboot into chaos ]</p>
          </div>
        )}
      </div>
    </div>
  )
}
