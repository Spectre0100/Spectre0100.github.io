import { useEffect, useState } from 'react'
import Distruptions from './Distruptions.tsx'
import { fetchDistruptions } from '../api/fetchDistruptions.tsx'
import TimerBar from './TimerBar.tsx'
import { config } from '../api/config.ts'
import Stations from './Stations.tsx'
import { fetchArrivals } from '../api/fetchArrivals.tsx'
import { initialiseStation } from '../utils/stationBuilder.ts'
export default function TfLLive() {
  const [distruptions, setDistruptions] = useState()
  const [stations, setStations] = useState(
    config.stations.map(initialiseStation),
  )
  const [timeToRefresh, setTimeToRefresh] = useState(-1)
  useEffect(() => {
    const tickMs = 1000
    const decrement = (100 * tickMs) / config.refreshInterval
    const refreshData = () => {
      const allData: any = []
      const clearTimerIfGotAllData = (data: any) => {
        allData.push(data)
        if (allData.length === stations.length + 1) {
          setTimeToRefresh(100 + decrement)
        }
      }
      stations.map((station: any, index: number) => {
        fetchArrivals(station, (updatedStation: any) => {
          clearTimerIfGotAllData(updatedStation)
          setStations((prevStations: any) => {
            const newStations = [...prevStations]
            newStations[index] = updatedStation
            return [...newStations]
          })
        })
      })
      fetchDistruptions((data: any) => {
        setDistruptions(data)
        clearTimerIfGotAllData(data)
      })
    }

    refreshData()

    const interval = setInterval(() => {
      setTimeToRefresh((prev) => {
        if (prev <= 0) {
          refreshData()
          return 200 //to prevent refresh immediately but try again in next window if failed to refresh
        }
        return prev - decrement
      })
    }, tickMs)
    return () => clearInterval(interval)
  }, [])
  return (
    <div>
      <TimerBar percentage={timeToRefresh} />
      <Distruptions distruptions={distruptions} />
      <Stations stations={stations} />
    </div>
  )
}
