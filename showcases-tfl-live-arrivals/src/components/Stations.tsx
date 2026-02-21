export default function Stations({ stations }: { stations: any }) {
  return (
    <div>
      {Object.values(stations).map((station: any, index: number) => (
        <div className={`station-card  ${station.line}`} key={index}>
          <div className='station-header'>
            <div className='station-name'>
              <a href={`./first-last-trains?station=${station.displayName}`}>
                {station.displayName}
              </a>
            </div>
          </div>
          <div className='station-body' id='body-wmb'>
            <div className='arrivals-list'>
              {station.arrivals.map((arrival: any, index: number) => (
                <div className='arrival-row' key={index}>
                  <div className='arrival-destination'>{arrival.dest}</div>
                  <div
                    className={`arrival-time ${
                      arrival.time < 0 ? '' : arrival.time < 60 ? 'urgent' : ''
                    }`}
                  >
                    {arrival.time < 0
                      ? 'Loading...'
                      : arrival.time < 60
                      ? `${arrival.time}s`
                      : `${Math.round(arrival.time / 60)} min`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
