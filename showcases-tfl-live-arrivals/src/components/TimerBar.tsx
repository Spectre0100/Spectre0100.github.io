export default function TimerBar({ percentage }: { percentage: number }) {
  const style: any = {
    height: '100%',
    background: 'linear-gradient(90deg, #36d, #9cf, #36d)',
  }
  if (percentage < 0) {
    style.width = '100%'
    style.animation = 'progressBarIndeterminate 1.25s linear infinite'
  } else if (percentage < 100) {
    style.width = `${percentage}%`
    style.transition = 'width 0.5s ease'
  } else {
    style.width = '100%'
    style.background = 'green'
    style.transition = ''
  }
  return (
    <div className='timer-bar'>
      <div
        className='progress'
        style={style}
      >
      </div>
    </div>
  )
}
