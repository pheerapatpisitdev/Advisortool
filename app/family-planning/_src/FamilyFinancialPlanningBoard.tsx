import './board.css'
import { boardTiles } from './boardConfig'

const byPosition = (position: 'left' | 'top' | 'right' | 'bottom') =>
  boardTiles.filter((tile) => tile.position === position)

export function FamilyFinancialPlanningBoard() {
  const left = byPosition('left')
  const top = byPosition('top')
  const right = byPosition('right')
  const bottom = byPosition('bottom')

  return (
    <div className="ffp-app">
      <div className="ffp-shell">
        <aside className="ffp-column ffp-column-left">
          {left.map((tile) => (
            <Tile key={tile.id} title={tile.label} description={tile.description} />
          ))}
        </aside>

        <main className="ffp-main">
          <header className="ffp-row ffp-row-top">
            {top.map((tile) => (
              <Tile key={tile.id} title={tile.label} description={tile.description} />
            ))}
          </header>

          <section className="ffp-center">
            <div className="ffp-center-card">
              <h1>Family Financial Planning</h1>
              <p>วางแผนการเงินครอบครัว</p>
              <div className="ffp-center-meta">
                <span>ครอบครัว B</span>
                <span>รอบที่ 2 / 3</span>
              </div>
              <div className="ffp-dice">🎲</div>
              <small>แตะเพื่อลูกเต๋า</small>
            </div>
          </section>

          <footer className="ffp-row ffp-row-bottom">
            {bottom.map((tile) => (
              <Tile key={tile.id} title={tile.label} description={tile.description} />
            ))}
          </footer>
        </main>

        <aside className="ffp-column ffp-column-right">
          {right.map((tile) => (
            <Tile key={tile.id} title={tile.label} description={tile.description} align="right" />
          ))}
        </aside>
      </div>
    </div>
  )
}

type TileProps = {
  title: string
  description?: string
  align?: 'left' | 'right' | 'center'
}

function Tile({ title, description, align = 'center' }: TileProps) {
  return (
    <div className={`ffp-tile ffp-tile-align-${align}`}>
      <div className="ffp-tile-title">{title}</div>
      {description && <div className="ffp-tile-desc">{description}</div>}
    </div>
  )
}

