import { cleanLineDescription, toTitleCase } from '../utils/stringUtils.ts'
import { config } from './config.ts'
const lines = [...new Set(config.stations.map((s) => s.line))].join(',')
export function fetchDistruptions(onSuccess: any) {
  fetch(`https://api.tfl.gov.uk/Line/${lines}/Status`)
    .then((response) => response.json())
    .then((data) => {
      if (!Array.isArray(data)) {
        onSuccess(undefined)
        return
      }
      const disruptions: { line: string; description: string }[] = []
      for (const line of data) {
        const lineStatus = line.lineStatuses[0]
        if (lineStatus.statusSeverityDescription !== 'Good Service') {
          disruptions.push({
            line: toTitleCase(line.name),
            description: cleanLineDescription(
              lineStatus.reason || lineStatus.statusSeverityDescription,
            ),
          })
        }
      }
      if (disruptions.length === 0) {
        disruptions.push({
          line: 'Metropolitan (example)',
          description:
            'Thursday 19, Friday 20, Saturday 21 and Sunday 22 February, no service between Harrow-on-the-Hill and Amersham / Chesham / Watford. There will also be no CHILTERN RAILWAYS services between Marylebone and Aylesbury Vale Parkway (via Amersham). Replacement buses operate.',
        })
      }

      onSuccess(disruptions)
    })
}
