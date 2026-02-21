export const config = {
  // Define stations
  stations: [
    {
      code: "wmb",
      line: "metropolitan",
      id: "940GZZLUWYP",
      direction: "outbound",
      displayName: "Wembley Park",
    },
    {
      code: "wyp",
      line: "jubilee",
      id: "940GZZLUWYP",
      direction: "outbound",
      displayName: "Wembley Park",
    },
    {
      code: "tot",
      line: "elizabeth",
      id: "910GTOTCTRD",
      direction: "inbound",
      displayName: "Tottenham Court Road",
    },
    {
      code: "can",
      line: "elizabeth",
      id: "910GCANWHRF",
      direction: "outbound",
      displayName: "Canary Wharf",
    },
    {
      code: "cyf",
      line: "jubilee",
      id: "940GZZLUCYF",
      direction: "inbound",
      displayName: "Canary Wharf",
    },
  ],
  // Define line colors
  lineColors: {
    bakerloo: "#B26300",
    central: "#DC241F",
    circle: "#FFC80A",
    district: "#007D32",
    dlr: "#00AFAD",
    elizabeth: "#60399E",
    hammersmith_city: "#F589A6",
    jubilee: "#838D93",
    metropolitan: "#9b0056",
    northern: "#000000",
    piccadilly: "#0019A8",
    victoria: "#039BE5",
    waterloo_city: "#76D0BD",
  },
  // Refresh interval in milliseconds
  refreshInterval: 10000,
};
