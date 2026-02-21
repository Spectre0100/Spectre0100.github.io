import Admonition from '@theme/Admonition'
export default function Distruptions({ distruptions }: { distruptions: any }) {
  if (distruptions === undefined) {
    return <Admonition type='info' title='LOADING...' />
  }
  if (distruptions.length === 0) {
    return <Admonition type='tip' title='NO DISRUPTIONS' />
  }

  return (
    <Admonition type='warning' title='DISRUPTIONS'>
      {distruptions.map((disruption: any) => (
        <details open={false}>
          <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
            {disruption.line}
          </summary>
          <div style={{ padding: '10px', borderLeft: '2px solid #ccc' }}>
            {disruption.description}
          </div>
        </details>
      ))}
    </Admonition>
  )
}
