import { config } from "../api/config.ts";
import Timetable from "./Timetable.tsx";
export default function FirstLastTrain() {
  const queryParams = new URLSearchParams(location.search);
  const stationName = queryParams.get("station");
  const station = config.stations.find((station: any) =>
    station.displayName === stationName
  );
  if (!station) {
    return <div>Station not found</div>;
  }
  return (
    <div>
      <h1>
        <a
          onClick={() => {
            history.back();
            return false;
          }}
          className="back-button"
        >
          🔙
        </a>
        {stationName}
      </h1>
      <Timetable station={station} />
    </div>
  );
}
