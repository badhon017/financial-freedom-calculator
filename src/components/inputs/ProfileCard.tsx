import { Card, StepperField } from '../ui/primitives'
import { monthName } from '../../lib/format'
import type { CardProps } from './types'

export function ProfileCard({ inputs, update, patch }: CardProps) {
  const yearsAway = inputs.retirementAge - inputs.currentAge

  return (
    <Card
      icon="user"
      title="You"
      subtitle={`Projection starts ${monthName(inputs.startMonth)} ${inputs.startYear}`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StepperField
          label="Current age"
          value={inputs.currentAge}
          min={15}
          max={99}
          suffix="yrs"
          onChange={(value) =>
            // Keep the two ages consistent: raising your age past the age you
            // meant to stop pushes that along rather than leaving it invalid.
            patch({
              currentAge: value,
              retirementAge: Math.max(inputs.retirementAge, value + 1),
            })
          }
        />
        <StepperField
          label="Hope to stop working at"
          value={inputs.retirementAge}
          min={inputs.currentAge + 1}
          max={100}
          suffix="yrs"
          hint={yearsAway === 1 ? '1 year from now' : `${yearsAway} years from now`}
          onChange={(value) => update('retirementAge', value)}
        />
      </div>
    </Card>
  )
}
