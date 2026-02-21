export const toTitleCase = (str: string) =>
  str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  )
export const cleanLineDescription = (str: string) =>
  str.replace(/^[A-Za-z\s]+Line:\s*/i, '')
export const getStopName = (str: string) =>
  str.replace(/ Underground Station| Rail Station| DLR Station| Station/g, '')
    .trim()
