export type BoardTilePosition = 'left' | 'top' | 'right' | 'bottom'

export interface BoardTile {
  id: string
  label: string
  description?: string
  position: BoardTilePosition
}

export const boardTiles: BoardTile[] = [
  // ซ้ายมือ (บนลงล่าง)
  {
    id: 'start',
    label: '',
    position: 'left',
  },
  {
    id: 'mortgage',
    label: '',
    position: 'left',
  },
  {
    id: 'tuition',
    label: '',
    position: 'left',
  },
  {
    id: 'medicine-monthly',
    label: '',
    position: 'left',
  },
  {
    id: 'car-installment',
    label: '',
    position: 'left',
  },
  {
    id: 'utilities',
    label: '',
    position: 'left',
  },
  {
    id: 'phone-internet',
    label: '',
    position: 'left',
  },
  {
    id: 'grocery',
    label: '',
    position: 'left',
  },
  {
    id: 'transport',
    label: '',
    position: 'left',
  },
  {
    id: 'subscription',
    label: '',
    position: 'left',
  },

  // แถวบน (ซ้ายไปขวา)
  {
    id: 'life-insurance',
    label: '',
    position: 'top',
  },
  {
    id: 'cancer-father',
    label: '',
    position: 'top',
  },
  {
    id: 'bonus',
    label: '',
    position: 'top',
  },
  {
    id: 'stroke-mother-in-law',
    label: '',
    position: 'top',
  },
  {
    id: 'policy-review',
    label: '',
    position: 'top',
  },
  {
    id: 'emergency-fund',
    label: '',
    position: 'top',
  },
  {
    id: 'investment-plan',
    label: '',
    position: 'top',
  },
  {
    id: 'child-education-plan',
    label: '',
    position: 'top',
  },
  {
    id: 'retirement-plan',
    label: '',
    position: 'top',
  },
  {
    id: 'financial-goal',
    label: '',
    position: 'top',
  },

  // ขวา (บนลงล่าง)
  {
    id: 'child-dengue',
    label: '',
    position: 'right',
  },
  {
    id: 'savings-grow',
    label: '',
    position: 'right',
  },
  {
    id: 'breadwinner-death',
    label: '',
    position: 'right',
  },
  {
    id: 'market-downturn',
    label: '',
    position: 'right',
  },
  {
    id: 'business-loss',
    label: '',
    position: 'right',
  },
  {
    id: 'family-illness',
    label: '',
    position: 'right',
  },
  {
    id: 'unexpected-repair',
    label: '',
    position: 'right',
  },
  {
    id: 'debt-overlimit',
    label: '',
    position: 'right',
  },
  {
    id: 'impulse-shopping',
    label: '',
    position: 'right',
  },
  {
    id: 'savings-target',
    label: '',
    position: 'right',
  },

  // แถวล่าง (ซ้ายไปขวา)
  {
    id: 'family-summary',
    label: '',
    position: 'bottom',
  },
  {
    id: 'strong-family',
    label: '',
    position: 'bottom',
  },
  {
    id: 'cancer-high-cost',
    label: '',
    position: 'bottom',
  },
  {
    id: 'renew-insurance',
    label: '',
    position: 'bottom',
  },
  {
    id: 'critical-illness-mom',
    label: '',
    position: 'bottom',
  },
  {
    id: 'annual-tax',
    label: '',
    position: 'bottom',
  },
  {
    id: 'charity',
    label: '',
    position: 'bottom',
  },
  {
    id: 'family-trip',
    label: '',
    position: 'bottom',
  },
  {
    id: 'achieve-goal',
    label: '',
    position: 'bottom',
  },
  {
    id: 'review-year',
    label: '',
    position: 'bottom',
  },
]

