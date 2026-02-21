import { useEffect, useState } from 'react'
import Admonition from '@theme/Admonition'
import { fetchTimeTable } from '../api/fetchTimeTable.tsx'
export default function Timetable({ station }: { station: any }) {
  const [timeTable, setTimeTable] = useState<any>()
  useEffect(() => {
    fetchTimeTable(station, setTimeTable)
  }, [station])
  if (!timeTable) {
    return <div>Loading...</div>
  }
  if (!timeTable.routes) {
    return <div>No timetable found</div>
  }
  return (
    <div>
      <Admonition type='danger' title='TODO: Parse and build timetable'>
        <code>{JSON.stringify(timeTable, null, 2)}</code>
      </Admonition>
    </div>
  )
}
