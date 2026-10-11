import { Card, NumberField } from '../ui/primitives'
import { monthName } from '../../lib/format'
import type { CardProps } from './types'

export function ProfileCard({ inputs, update }: CardProps) {
  return (
    <Card
      icon="user"
      title="You"
      subtitle={`Projection starts ${monthName(inputs.startMonth)} ${inputs.startYear}`}
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Current age"
          value={inputs.currentAge}
          onChange={(value) => update('currentAge', Math.min(99, Math.max(15, value)))}
          min={15}
          max={99}
        />
        <NumberField
          label="Hope to stop working at"
          value={inputs.retirementAge}
          onChange={(value) => update('retirementAge', Math.min(100, Math.max(inputs.currentAge + 1, value)))}
          min={inputs.currentAge + 1}
          max={100}
          suffix="yrs"
        />
      </div>
    </Card>
  )
}
