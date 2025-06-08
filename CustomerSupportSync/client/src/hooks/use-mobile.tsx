import * as React from "react"

const MOBILE_BREAKPOINT = 768
const LG_BREAKPOINT = 1024

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isLg, setIsLg] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mobileMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const lgMql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      setIsLg(window.innerWidth >= LG_BREAKPOINT)
    }
    
    mobileMql.addEventListener("change", onChange)
    lgMql.addEventListener("change", onChange)
    
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setIsLg(window.innerWidth >= LG_BREAKPOINT)
    
    return () => {
      mobileMql.removeEventListener("change", onChange)
      lgMql.removeEventListener("change", onChange)
    }
  }, [])

  return { isMobile: !!isMobile, isLg: !!isLg }
}

// Keep the original function for backward compatibility
export function useIsMobile() {
  const { isMobile } = useMobile()
  return isMobile
}
