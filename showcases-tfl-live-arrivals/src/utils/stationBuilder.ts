export const initialiseStation = (station: any) => ({
  ...station,
  arrivals: [
    { dest: '', time: -1 },
    { dest: '', time: -1 },
    { dest: '', time: -1 },
  ],
})
