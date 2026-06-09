/**
 * iOS Safari 滚动锁定工具
 * 防止弹窗/遮罩打开时背景页面滚动偏移
 */
let lockCount = 0
let scrollY = 0

export function lockBodyScroll() {
  if (lockCount === 0) {
    scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}

export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    window.scrollTo(0, scrollY)
  }
}