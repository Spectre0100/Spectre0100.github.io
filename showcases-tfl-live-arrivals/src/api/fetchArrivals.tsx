import { initialiseStation } from '../utils/stationBuilder.ts'
import { getStopName } from '../utils/stringUtils.ts'
export function fetchArrivals(station: any, onSuccess: any) {
  fetch(
    `https://api.tfl.gov.uk/line/${station.line}/arrivals/${station.id}?direction=${station.direction}`,
  )
    .then((response) => response.json())
    .then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        const arrivals = data
          .map((arrival: any) => ({
            dest: getStopName(arrival.destinationName),
            time: arrival.timeToStation,
          }))
          .sort((a: any, b: any) => a.time - b.time)
          .slice(0, 3)
        onSuccess({ ...station, arrivals })
      } else {
        onSuccess(initialiseStation(station))
      }
    })
}
