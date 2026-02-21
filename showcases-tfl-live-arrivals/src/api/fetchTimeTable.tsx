export function fetchTimeTable(station: any, onSuccess: any) {
  console.log('fetching timetable for', station)
  fetch(
    `https://api.tfl.gov.uk/line/${station.line}/timetable/${station.id}?direction=${station.direction}`,
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.timetable?.routes) {
        //TODO build timetable object
        onSuccess(data.timetable)
      } else {
        onSuccess(
          {},
        )
      }
    })
}
