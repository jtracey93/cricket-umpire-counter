import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Gear, 
  Target, 
  ArrowCounterClockwise,
  Plus,
  Pencil,
  CaretDown,
  CaretUp,
  Warning
} from '@phosphor-icons/react'
import { useKV } from './hooks/useKV'
import { toast } from 'sonner'

type DeliveryType = 'legal' | 'wide' | 'no-ball' | 'wicket' | 'bye' | 'leg-bye'

// Delivery types that ask "how many runs?" via the quick picker when scoring is on
type PickerMode = 'legal' | 'wide' | 'no-ball' | 'bye' | 'leg-bye'

interface DeliveryRecord {
  type: DeliveryType
  ballNumber: number // The ball number in this over when this delivery was made
  runs: number // Total runs added to the team total for this delivery (incl. any penalty)
}

interface Action {
  id: string
  type: 'delivery' | 'wicket' | 'reset'
  deliveryType?: DeliveryType
  ballsBefore: number
  oversBefore: number
  wicketsBefore: number
  runsBefore: number
  currentOverDeliveriesBefore: DeliveryRecord[]
  timestamp: number
}

function App() {
  // Persistent state using useKV
  const [balls, setBalls] = useKV('cricket-balls', 0)
  const [overs, setOvers] = useKV('cricket-overs', 0)  
  const [wickets, setWickets] = useKV('cricket-wickets', 0)
  const [runs, setRuns] = useKV('cricket-runs', 0)
  const [scoringEnabled, setScoringEnabled] = useKV('scoring-enabled', true)
  const [widePenalty, setWidePenalty] = useKV('wide-penalty', 1)
  const [noBallPenalty, setNoBallPenalty] = useKV('noball-penalty', 1)
  const [widesRebowled, setWidesRebowled] = useKV('wides-rebowled', true)
  const [noBallsRebowled, setNoBallsRebowled] = useKV('noballs-rebowled', true)
  const [currentOverDeliveries, setCurrentOverDeliveries] = useKV<DeliveryRecord[]>('current-over-deliveries', [])
  const [actionHistory, setActionHistory] = useKV<Action[]>('action-history', [])
  
  // Local state for dialogs (doesn't need persistence)
  const [lastAction, setLastAction] = useState<Action | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOverCompleteDialog, setShowOverCompleteDialog] = useState(false)
  const [showAllOutDialog, setShowAllOutDialog] = useState(false)

  // Current Over Details is collapsed by default when scoring (to save space)
  const [overDetailsOpen, setOverDetailsOpen] = useState(!scoringEnabled)

  // Run picker (used by 5+ and the extras buttons when scoring is on)
  const [picker, setPicker] = useState<{ open: boolean; mode: PickerMode }>({ open: false, mode: 'legal' })
  const [customRuns, setCustomRuns] = useState('')

  // Manual "set / resume score" entry
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualRuns, setManualRuns] = useState('')
  const [manualWickets, setManualWickets] = useState('')
  const [manualOvers, setManualOvers] = useState('')

  const ballsRemaining = 6 - balls
  const isOverComplete = balls >= 6
  const isAwaitingOverConfirmation = balls >= 6 && showOverCompleteDialog
  const totalDeliveriesInOver = currentOverDeliveries.length
  const legalDeliveriesInOver = currentOverDeliveries.filter(d => d.type === 'legal' || d.type === 'wicket' || d.type === 'bye' || d.type === 'leg-bye').length
  const widesInOver = currentOverDeliveries.filter(d => d.type === 'wide').length
  const noBallsInOver = currentOverDeliveries.filter(d => d.type === 'no-ball').length
  const wicketsInOver = currentOverDeliveries.filter(d => d.type === 'wicket').length
  const runsInOver = currentOverDeliveries.reduce((sum, d) => sum + d.runs, 0)
  const canUndo = actionHistory.length > 0

  // Innings ends at 10 wickets ("all out"); lock deliveries while all out or
  // while waiting to confirm a completed over.
  const isAllOut = wickets >= 10
  const deliveriesLocked = isAwaitingOverConfirmation || isAllOut

  // Total legal balls bowled this innings, used for the current run rate
  const totalLegalBalls = overs * 6 + balls
  const runRate = totalLegalBalls > 0 ? runs / (totalLegalBalls / 6) : 0

  const addToHistory = (action: Omit<Action, 'id' | 'timestamp'>) => {
    const newAction: Action = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    
    // Keep only the last 10 actions to avoid memory issues
    setActionHistory(current => [...current, newAction].slice(-10))
    setLastAction(newAction)
  }

  // runsScored = runs off the bat (legal) / runs run (bye, leg-bye) /
  // extra runs run on top of the penalty (wide, no-ball). Ignored when scoring is off.
  const recordDelivery = (type: DeliveryType, runsScored = 0) => {
    // Record the action for undo
    addToHistory({
      type: 'delivery',
      deliveryType: type,
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets,
      runsBefore: runs,
      currentOverDeliveriesBefore: [...currentOverDeliveries]
    })

    let shouldIncrementBall = true

    // Apply rebowl rules
    if (type === 'wide' && widesRebowled) {
      shouldIncrementBall = false
    } else if (type === 'no-ball' && noBallsRebowled) {
      shouldIncrementBall = false
    }

    // Work out the runs added to the team total for this delivery
    let deliveryRuns = 0
    if (scoringEnabled) {
      if (type === 'wide') {
        deliveryRuns = widePenalty + runsScored
      } else if (type === 'no-ball') {
        deliveryRuns = noBallPenalty + runsScored
      } else {
        deliveryRuns = runsScored
      }
    }

    if (deliveryRuns > 0) {
      setRuns((current) => current + deliveryRuns)
    }

    // Add delivery to current over tracking
    const newDelivery: DeliveryRecord = {
      type,
      ballNumber: totalDeliveriesInOver + 1,
      runs: deliveryRuns
    }
    
    setCurrentOverDeliveries((current) => [...current, newDelivery])

    if (shouldIncrementBall) {
      setBalls((currentBalls) => {
        const newBalls = currentBalls + 1
        // Check if over is complete (6 legal balls)
        if (newBalls >= 6) {
          // Show confirmation dialog instead of automatically progressing
          setShowOverCompleteDialog(true)
          return newBalls // Keep balls at 6 until confirmed
        }
        return newBalls
      })
    }

    // Show feedback based on delivery type
    if (type === 'legal') {
      if (scoringEnabled) {
        toast.success(runsScored === 0 ? 'Dot ball' : `${runsScored} run${runsScored > 1 ? 's' : ''}`)
      } else {
        toast.success('Legal delivery')
      }
    } else if (type === 'wide') {
      const suffix = widesRebowled ? ' (re-bowled)' : ''
      toast.warning(scoringEnabled ? `Wide +${deliveryRuns}${suffix}` : `Wide${suffix}`)
    } else if (type === 'no-ball') {
      const suffix = noBallsRebowled ? ' (re-bowled)' : ''
      toast.warning(scoringEnabled ? `No-ball +${deliveryRuns}${suffix}` : `No-ball${suffix}`)
    } else if (type === 'bye') {
      toast.success(`Bye +${runsScored}`)
    } else if (type === 'leg-bye') {
      toast.success(`Leg-bye +${runsScored}`)
    }
  }

  const recordWicket = () => {
    // Innings is over once 10 wickets are down
    if (wickets >= 10) {
      toast.error('All out — innings over')
      setShowAllOutDialog(true)
      return
    }

    addToHistory({
      type: 'wicket', 
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets,
      runsBefore: runs,
      currentOverDeliveriesBefore: [...currentOverDeliveries]
    })
    
    // Add wicket delivery to current over tracking as a wicket type
    const newDelivery: DeliveryRecord = {
      type: 'wicket',
      ballNumber: totalDeliveriesInOver + 1,
      runs: 0
    }
    
    setCurrentOverDeliveries((current) => [...current, newDelivery])
    
    // Increment wickets (capped at 10)
    const newWickets = wickets + 1
    setWickets(newWickets)
    
    // Wicket counts as a legal delivery
    const newBalls = balls + 1
    setBalls(newBalls)

    if (newWickets >= 10) {
      // All out — innings over. Show the all-out popup and skip the
      // over-complete prompt even if this was the 6th ball.
      setShowAllOutDialog(true)
      toast.success('Wicket — all out!')
    } else {
      if (newBalls >= 6) {
        // Show confirmation dialog instead of automatically progressing
        setShowOverCompleteDialog(true)
      }
      toast.success('Wicket! (Legal delivery)')
    }
  }

  const undoLastAction = () => {
    if (actionHistory.length === 0) return

    // Get the most recent action
    const actionToUndo = actionHistory[actionHistory.length - 1]
    
    // Remove it from history
    setActionHistory(current => current.slice(0, -1))
    
    // Update last action to the previous one (or null if none)
    const previousAction = actionHistory[actionHistory.length - 2] || null
    setLastAction(previousAction)

    // Restore state to before the action
    setBalls(actionToUndo.ballsBefore)
    setOvers(actionToUndo.oversBefore)
    setWickets(actionToUndo.wicketsBefore)
    setRuns(actionToUndo.runsBefore)
    setCurrentOverDeliveries(actionToUndo.currentOverDeliveriesBefore)
    
    // Close any open dialogs that might be affected
    setShowOverCompleteDialog(false)
    setShowAllOutDialog(false)
    
    // Show appropriate toast
    if (actionToUndo.type === 'delivery') {
      toast.info(`Undone: ${actionToUndo.deliveryType} delivery`)
    } else if (actionToUndo.type === 'wicket') {
      toast.info('Undone: wicket')
    } else if (actionToUndo.type === 'reset') {
      toast.info('Undone: reset')
    }
  }

  const confirmOverComplete = () => {
    setOvers((currentOvers) => currentOvers + 1)
    setBalls(0)
    setCurrentOverDeliveries([])
    // Reset action history at end of each over
    setActionHistory([])
    setLastAction(null)
    setShowOverCompleteDialog(false)
    toast.success('Over Complete! New over started.')
  }

  const resetCounters = () => {
    setBalls(0)
    setOvers(0)
    setWickets(0)
    setRuns(0)
    setCurrentOverDeliveries([])
    setActionHistory([])
    setLastAction(null)
    setShowResetDialog(false)
    setShowAllOutDialog(false)
    toast.success('Counters and history reset')
  }

  // ---- Run picker (scoring mode) ----
  const openPicker = (mode: PickerMode) => {
    setCustomRuns('')
    setPicker({ open: true, mode })
  }

  const handlePickRuns = (runsScored: number) => {
    const mode = picker.mode
    setPicker((p) => ({ ...p, open: false }))
    setCustomRuns('')
    recordDelivery(mode, runsScored)
  }

  // ---- Manual set / resume score ----
  const hasMatchData =
    runs > 0 || wickets > 0 || overs > 0 || balls > 0 || currentOverDeliveries.length > 0

  const openManualEntry = () => {
    setShowSettings(false)
    setManualRuns(scoringEnabled ? String(runs) : '')
    setManualWickets(String(wickets))
    setManualOvers(`${overs}.${balls}`)
    setShowManualEntry(true)
  }

  const applyManualEntry = () => {
    // Parse overs in "O.B" notation (e.g. 11.3 = 11 overs, 3 balls into the next)
    const [oversPartRaw, ballsPartRaw = '0'] = manualOvers.trim().split('.')
    const oversPart = parseInt(oversPartRaw, 10)
    const ballsPart = parseInt(ballsPartRaw, 10)
    const wicketsVal = parseInt(manualWickets, 10)
    const runsVal = scoringEnabled ? parseInt(manualRuns, 10) : 0

    if (isNaN(oversPart) || oversPart < 0) {
      toast.error('Enter overs as a whole number, e.g. 11')
      return
    }
    if (isNaN(ballsPart) || ballsPart < 0 || ballsPart > 5) {
      toast.error('Balls into the over must be 0–5 (e.g. 11.3)')
      return
    }
    if (isNaN(wicketsVal) || wicketsVal < 0 || wicketsVal >= 10) {
      toast.error('Wickets must be less than 10 (10 wickets = all out)')
      return
    }
    if (scoringEnabled && (isNaN(runsVal) || runsVal < 0)) {
      toast.error('Runs must be 0 or more')
      return
    }

    setOvers(oversPart)
    setBalls(ballsPart)
    setWickets(wicketsVal)
    setRuns(runsVal)
    // Prior ball-by-ball is unknown, so clear this over's detail and undo history
    setCurrentOverDeliveries([])
    setActionHistory([])
    setLastAction(null)
    setShowOverCompleteDialog(false)
    setShowManualEntry(false)
    toast.success(
      scoringEnabled
        ? `Score set: ${runsVal}/${wicketsVal} · ${oversPart}.${ballsPart} ov`
        : `Set to ${oversPart}.${ballsPart} ov · ${wicketsVal} down`
    )
  }

  // Label + colour for a delivery chip in the over sequence
  const chipFor = (d: DeliveryRecord): { label: string; className: string } => {
    switch (d.type) {
      case 'legal':
        return { label: d.runs > 0 ? String(d.runs) : '•', className: 'bg-primary text-primary-foreground' }
      case 'wicket':
        return { label: 'W', className: 'bg-accent text-accent-foreground' }
      case 'wide':
        return { label: scoringEnabled ? `Wd+${d.runs}` : 'Wd', className: 'bg-yellow-200 text-yellow-800' }
      case 'no-ball':
        return { label: scoringEnabled ? `Nb+${d.runs}` : 'NB', className: 'bg-orange-200 text-orange-800' }
      case 'bye':
        return { label: `B${d.runs}`, className: 'bg-sky-200 text-sky-800' }
      case 'leg-bye':
        return { label: `Lb${d.runs}`, className: 'bg-indigo-200 text-indigo-800' }
      default:
        return { label: '?', className: 'bg-muted text-muted-foreground' }
    }
  }

  // ---- Inline validation for the Set / Resume Score dialog ----
  // Each returns an error string when the current input is non-empty and invalid,
  // otherwise null. Empty fields are handled by the submit-enabled check below.
  const manualWicketsError: string | null = (() => {
    if (manualWickets.trim() === '') return null
    const n = parseInt(manualWickets, 10)
    if (isNaN(n)) return 'Enter a whole number'
    if (n < 0) return 'Cannot be negative'
    if (n >= 10) return 'Must be less than 10 (10 wickets = all out)'
    return null
  })()

  const manualOversError: string | null = (() => {
    const t = manualOvers.trim()
    if (t === '') return null
    const parts = t.split('.')
    if (parts.length > 2) return 'Use overs.balls, e.g. 11.3'
    const o = parseInt(parts[0], 10)
    if (parts[0].trim() === '' || isNaN(o) || o < 0) return 'Enter whole overs, e.g. 11'
    const ballsRaw = parts[1] !== undefined && parts[1] !== '' ? parts[1] : '0'
    const b = parseInt(ballsRaw, 10)
    if (isNaN(b) || b < 0) return 'Balls must be 0–5'
    if (b > 5) return 'Max 6 legal balls per over — balls must be 0–5'
    return null
  })()

  const manualRunsError: string | null = (() => {
    if (!scoringEnabled) return null
    if (manualRuns.trim() === '') return null
    const n = parseInt(manualRuns, 10)
    if (isNaN(n)) return 'Enter a whole number'
    if (n < 0) return 'Cannot be negative'
    return null
  })()

  const canApplyManual =
    manualWicketsError === null && manualWickets.trim() !== '' &&
    manualOversError === null && manualOvers.trim() !== '' &&
    (!scoringEnabled || (manualRunsError === null && manualRuns.trim() !== ''))

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 pb-4 sm:pb-8">
      <div className="mx-auto max-w-md space-y-2 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cricket Umpire Counter</h1>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <Gear size={16} className="sm:size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Configure scoring and wide / no-ball rules
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                {/* Scoring mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="scoring-enabled">Scoring mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Track the team total with per-ball run buttons
                    </p>
                  </div>
                  <Switch
                    id="scoring-enabled"
                    checked={scoringEnabled}
                    onCheckedChange={setScoringEnabled}
                  />
                </div>

                <Separator />

                {/* Wides */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="wides-rebowled">Wides re-bowled</Label>
                      <p className="text-sm text-muted-foreground">
                        Wide deliveries must be bowled again
                      </p>
                    </div>
                    <Switch
                      id="wides-rebowled"
                      checked={widesRebowled}
                      onCheckedChange={setWidesRebowled}
                    />
                  </div>
                  {scoringEnabled && (
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="wide-penalty" className="text-sm font-normal text-muted-foreground">
                        Runs added per wide
                      </Label>
                      <Input
                        id="wide-penalty"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={widePenalty}
                        onChange={(e) => setWidePenalty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 text-center"
                      />
                    </div>
                  )}
                </div>

                {/* No-balls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="noballs-rebowled">No-balls re-bowled</Label>
                      <p className="text-sm text-muted-foreground">
                        No-ball deliveries must be bowled again
                      </p>
                    </div>
                    <Switch
                      id="noballs-rebowled" 
                      checked={noBallsRebowled}
                      onCheckedChange={setNoBallsRebowled}
                    />
                  </div>
                  {scoringEnabled && (
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="noball-penalty" className="text-sm font-normal text-muted-foreground">
                        Runs added per no-ball
                      </Label>
                      <Input
                        id="noball-penalty"
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={noBallPenalty}
                        onChange={(e) => setNoBallPenalty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-20 text-center"
                      />
                    </div>
                  )}
                </div>

                <Separator />

                <Button variant="outline" className="w-full" onClick={openManualEntry}>
                  <Pencil size={16} className="mr-2" />
                  Set / resume score…
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Over Complete Confirmation Dialog */}
        <Dialog open={showOverCompleteDialog} onOpenChange={setShowOverCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Over Complete!</DialogTitle>
              <DialogDescription>
                6 legal balls have been bowled. Ready to start the next over?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-center space-y-2">
                <div className="text-lg font-semibold text-primary">
                  Current: {overs}.{balls}
                </div>
                {scoringEnabled && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground">
                      {runsInOver} run{runsInOver === 1 ? '' : 's'} this over
                    </span>
                    <span className="rounded-md bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
                      Score {runs}/{wickets}
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Total deliveries this over: {totalDeliveriesInOver}
                </div>
                <div className="text-sm text-muted-foreground">
                  Legal balls: {legalDeliveriesInOver} | Extras: {widesInOver + noBallsInOver} | Wickets: {wicketsInOver}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOverCompleteDialog(false)}>
                Stay in Current Over
              </Button>
              <Button onClick={confirmOverComplete}>
                Start Next Over
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scoreboard (scoring mode) */}
        {scoringEnabled && (
          <Card className="bg-primary text-primary-foreground py-3 sm:py-6">
            <CardContent className="px-3 sm:px-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] sm:text-xs uppercase tracking-wide opacity-80">Score</div>
                  <div className="text-3xl sm:text-5xl font-bold leading-none">
                    {runs}<span className="opacity-70">/</span>{wickets}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base sm:text-2xl font-semibold leading-none">
                    {overs}.{balls}<span className="ml-1 text-xs sm:text-sm font-normal opacity-80">ov</span>
                  </div>
                  <div className="text-xs sm:text-sm opacity-80 mt-1">RR {runRate.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Counters */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          <Card className="py-2 sm:py-6 gap-1 sm:gap-6">
            <CardHeader className="pb-0.5 sm:pb-2 px-2 sm:px-6">
              <CardTitle className="text-xs sm:text-sm text-center text-muted-foreground">Balls</CardTitle>
            </CardHeader>
            <CardContent className="pt-0.5 sm:pt-2 px-2 sm:px-6">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-primary">{balls}</div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {ballsRemaining} remaining
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-2 sm:py-6 gap-1 sm:gap-6">
            <CardHeader className="pb-0.5 sm:pb-2 px-2 sm:px-6">
              <CardTitle className="text-xs sm:text-sm text-center text-muted-foreground">Overs</CardTitle>
            </CardHeader>
            <CardContent className="pt-0.5 sm:pt-2 px-2 sm:px-6">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-primary">{overs}</div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {overs}.{balls}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-2 sm:py-6 gap-1 sm:gap-6">
            <CardHeader className="pb-0.5 sm:pb-2 px-2 sm:px-6">
              <CardTitle className="text-xs sm:text-sm text-center text-muted-foreground">Wickets</CardTitle>
            </CardHeader>
            <CardContent className="pt-0.5 sm:pt-2 px-2 sm:px-6">
              <div className="text-center">
                <div className="text-2xl sm:text-4xl font-bold text-primary">{wickets}</div>
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  {10 - wickets} remaining
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Over Complete Badge */}
        {isOverComplete && !isAllOut && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              Over Complete - Ready for Next Over
            </Badge>
          </div>
        )}

        {/* All Out Badge */}
        {isAllOut && (
          <div className="flex justify-center">
            <Badge variant="destructive" className="gap-1">
              <Warning size={12} />
              All Out — Innings Over
            </Badge>
          </div>
        )}

        {/* Current Over Details */}
        <Card className="bg-muted/30 py-2 sm:py-6 gap-1 sm:gap-6">
          <CardHeader className="pb-1 sm:pb-3 px-2 sm:px-6">
            <button
              type="button"
              onClick={() => setOverDetailsOpen((o) => !o)}
              aria-expanded={overDetailsOpen}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="text-sm font-medium">Current Over Details</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {!overDetailsOpen && (
                  <span>
                    {totalDeliveriesInOver === 0
                      ? 'No deliveries yet'
                      : `${totalDeliveriesInOver} ball${totalDeliveriesInOver > 1 ? 's' : ''} · ${widesInOver + noBallsInOver} extra${widesInOver + noBallsInOver === 1 ? '' : 's'} · ${wicketsInOver} wkt${wicketsInOver === 1 ? '' : 's'}`}
                  </span>
                )}
                {overDetailsOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
              </span>
            </button>
          </CardHeader>
          {overDetailsOpen && (
          <CardContent className="pt-0.5 sm:pt-2 px-2 sm:px-6">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3 text-center text-sm">
                <div>
                  <div className="text-base sm:text-lg font-semibold text-primary">{totalDeliveriesInOver}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold text-primary">{legalDeliveriesInOver}</div>
                  <div className="text-xs text-muted-foreground">Legal</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold text-accent">{widesInOver + noBallsInOver}</div>
                  <div className="text-xs text-muted-foreground">Extras</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold text-destructive">{wicketsInOver}</div>
                  <div className="text-xs text-muted-foreground">Wickets</div>
                </div>
              </div>
              
              {(widesInOver > 0 || noBallsInOver > 0) && (
                <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-border hidden sm:block">
                  <div className="flex justify-center gap-2 sm:gap-4 text-xs">
                    {widesInOver > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {widesInOver} Wide{widesInOver > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {noBallsInOver > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {noBallsInOver} No-ball{noBallsInOver > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Delivery sequence visualization */}
              {totalDeliveriesInOver > 0 && (
                <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-1 sm:mb-2 text-center hidden sm:block">Delivery sequence:</div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {currentOverDeliveries.map((delivery, index) => {
                      const chip = chipFor(delivery)
                      return (
                        <Badge 
                          key={index}
                          variant={delivery.type === 'legal' ? 'default' : 'secondary'}
                          className={`text-xs ${chip.className}`}
                        >
                          {chip.label}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {totalDeliveriesInOver === 0 && (
                <div className="text-center text-sm text-muted-foreground py-1 sm:py-2">
                  No deliveries yet this over
                </div>
              )}
            </CardContent>
          )}
          </Card>

        {/* Delivery Buttons */}
        <Card className="py-2 sm:py-6 gap-2 sm:gap-6">
          <CardHeader className="pb-1 sm:pb-4 px-2 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-center">Record Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6">
            {scoringEnabled ? (
              <>
                {/* Run buttons (legal deliveries) */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                  {[0, 1, 2, 3, 4, 6].map((r) => (
                    <Button
                      key={r}
                      size="lg"
                      className="h-12 sm:h-16 text-lg sm:text-2xl font-bold"
                      onClick={() => recordDelivery('legal', r)}
                      disabled={deliveriesLocked}
                    >
                      {r === 0 ? '•' : r}
                    </Button>
                  ))}
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 sm:h-16 text-base sm:text-xl font-semibold"
                    onClick={() => openPicker('legal')}
                    disabled={deliveriesLocked}
                  >
                    5+
                  </Button>
                  <Button
                    size="lg"
                    className="h-12 sm:h-16 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={recordWicket}
                    disabled={deliveriesLocked}
                  >
                    <Target size={16} className="mr-1 sm:size-5" />
                    <span className="text-sm sm:text-base">Out</span>
                  </Button>
                </div>

                {/* Extras */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      size="lg"
                      className="w-full h-9 sm:h-14 text-sm sm:text-base bg-yellow-500 text-white hover:bg-yellow-600"
                      onClick={() => openPicker('wide')}
                      disabled={deliveriesLocked}
                    >
                      Wide
                    </Button>
                    {widesRebowled && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Re-bowl
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      size="lg"
                      className="w-full h-9 sm:h-14 text-sm sm:text-base bg-orange-500 text-white hover:bg-orange-600"
                      onClick={() => openPicker('no-ball')}
                      disabled={deliveriesLocked}
                    >
                      No-ball
                    </Button>
                    {noBallsRebowled && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        Re-bowl
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-9 sm:h-14 text-sm sm:text-base"
                    onClick={() => openPicker('bye')}
                    disabled={deliveriesLocked}
                  >
                    Bye
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-9 sm:h-14 text-sm sm:text-base"
                    onClick={() => openPicker('leg-bye')}
                    disabled={deliveriesLocked}
                  >
                    Leg-bye
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="w-full h-10 sm:h-16 text-base sm:text-lg font-semibold"
                  onClick={() => recordDelivery('legal')}
                  disabled={deliveriesLocked}
                >
                  Legal Delivery
                </Button>
                
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <Button 
                      size="lg" 
                      className="w-full h-8 sm:h-14 text-sm sm:text-base bg-yellow-500 text-white hover:bg-yellow-600"
                      onClick={() => recordDelivery('wide')}
                      disabled={deliveriesLocked}
                    >
                      Wide
                    </Button>
                    {widesRebowled && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Re-bowl
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Button 
                      size="lg"
                      className="w-full h-8 sm:h-14 text-sm sm:text-base bg-orange-500 text-white hover:bg-orange-600"
                      onClick={() => recordDelivery('no-ball')}
                      disabled={deliveriesLocked}
                    >
                      No-ball
                    </Button>
                    {noBallsRebowled && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        Re-bowl
                      </Badge>
                    )}
                  </div>
                  <Button 
                    size="lg"
                    variant="default"
                    className="h-8 sm:h-14 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={recordWicket}
                    disabled={deliveriesLocked}
                  >
                    <Target size={14} className="mr-1 sm:mr-2 sm:size-5" />
                    <span className="text-sm sm:text-base">Wicket</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Undo and Reset Buttons */}
        <div className="flex flex-col gap-1.5 sm:gap-3">
          {/* Set / Resume Score Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={openManualEntry}
              className="h-8 sm:h-14 w-full max-w-xs"
            >
              <Pencil size={14} className="mr-1 sm:mr-2 sm:size-5" />
              <span className="text-sm sm:text-base">Set / Resume Score</span>
            </Button>
          </div>

          {/* Undo Button */}
          <div className="flex justify-center">
            <Button 
              variant={!canUndo ? "outline" : "default"}
              size="lg"
              onClick={undoLastAction}
              disabled={!canUndo}
              className={`relative h-8 sm:h-14 w-full max-w-xs transition-all ${
                !canUndo 
                  ? 'opacity-50' 
                  : 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-md'
              }`}
              title={
                !canUndo 
                  ? 'No actions to undo'
                  : `Undo ${
                      lastAction?.type === 'delivery' 
                        ? `${lastAction.deliveryType} delivery` 
                        : lastAction?.type === 'wicket' 
                          ? 'wicket' 
                          : 'reset'
                    } (${actionHistory.length} actions available)`
              }
            >
              <ArrowCounterClockwise size={14} className="mr-1 sm:mr-2 sm:size-5" />
              <span className="text-sm sm:text-base">Undo {actionHistory.length > 0 && `(${actionHistory.length})`}</span>
              {actionHistory.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-primary text-primary-foreground"
                >
                  {actionHistory.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  variant="destructive"
                  className="h-8 sm:h-14 w-full max-w-xs"
                >
                  <ArrowCounterClockwise size={14} className="mr-1 sm:mr-2 sm:size-5" />
                  <span className="text-sm sm:text-base">Reset All</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset All Counters</DialogTitle>
                  <DialogDescription>
                    This will reset runs, balls, overs, and wickets to zero. This action can be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={resetCounters}>
                    Reset All
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Current Settings Display */}
        <Card className="bg-muted/50 py-2 sm:py-6 gap-1 sm:gap-6">
          <CardContent className="pt-2 sm:pt-4 px-2 sm:px-6">
            <div className="flex justify-between items-start mb-1.5 sm:mb-3">
              <div className="text-sm font-medium">Current Settings</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSettings(true)}
                className="h-4 sm:h-6 px-1 sm:px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Gear size={10} className="mr-0.5 sm:mr-1 sm:size-3.5" />
                Change
              </Button>
            </div>
            <div className="text-sm space-y-1 sm:space-y-2">
              <div className="flex justify-between">
                <span>Scoring:</span>
                <span className={scoringEnabled ? "text-accent" : "text-muted-foreground"}>
                  {scoringEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Wides:</span>
                <span className={widesRebowled ? "text-accent" : "text-muted-foreground"}>
                  {widesRebowled ? "Re-bowled" : "Count as ball"}{scoringEnabled ? ` · +${widePenalty}` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span>No-balls:</span>
                <span className={noBallsRebowled ? "text-accent" : "text-muted-foreground"}>
                  {noBallsRebowled ? "Re-bowled" : "Count as ball"}{scoringEnabled ? ` · +${noBallPenalty}` : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Run Picker (scoring mode) */}
        <Dialog open={picker.open} onOpenChange={(open) => setPicker((p) => ({ ...p, open }))}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>
                {picker.mode === 'legal' ? 'Runs scored' :
                 picker.mode === 'wide' ? 'Wide — extra runs run' :
                 picker.mode === 'no-ball' ? 'No-ball — extra runs run' :
                 picker.mode === 'bye' ? 'Byes' : 'Leg-byes'}
              </DialogTitle>
              <DialogDescription>
                {picker.mode === 'wide'
                  ? `A ${widePenalty}-run penalty is added automatically.`
                  : picker.mode === 'no-ball'
                    ? `A ${noBallPenalty}-run penalty is added automatically.`
                    : 'How many runs were taken?'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2 py-2">
              {[0, 1, 2, 3, 4, 5].map((r) => (
                <Button
                  key={r}
                  size="lg"
                  variant="outline"
                  className="h-14 text-xl font-bold"
                  onClick={() => handlePickRuns(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Other"
                value={customRuns}
                onChange={(e) => setCustomRuns(e.target.value)}
                className="text-center"
              />
              <Button
                onClick={() => {
                  const n = parseInt(customRuns, 10)
                  if (isNaN(n) || n < 0) {
                    toast.error('Enter a valid number of runs')
                    return
                  }
                  handlePickRuns(n)
                }}
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Set / Resume Score */}
        <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set / resume score</DialogTitle>
              <DialogDescription>
                Picking up mid-innings? Enter the current state to carry on from here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {scoringEnabled && (
                <div className="space-y-1">
                  <Label htmlFor="manual-runs">Runs</Label>
                  <Input
                    id="manual-runs"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={manualRuns}
                    onChange={(e) => setManualRuns(e.target.value)}
                    placeholder="e.g. 87"
                    aria-invalid={!!manualRunsError}
                    className={manualRunsError ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {manualRunsError && (
                    <p className="text-xs text-destructive">{manualRunsError}</p>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="manual-wickets">Wickets down</Label>
                <Input
                  id="manual-wickets"
                  type="number"
                  min={0}
                  max={9}
                  inputMode="numeric"
                  value={manualWickets}
                  onChange={(e) => setManualWickets(e.target.value)}
                  placeholder="e.g. 3"
                  aria-invalid={!!manualWicketsError}
                  className={manualWicketsError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {manualWicketsError && (
                  <p className="text-xs text-destructive">{manualWicketsError}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="manual-overs">Overs bowled</Label>
                <Input
                  id="manual-overs"
                  type="text"
                  inputMode="decimal"
                  value={manualOvers}
                  onChange={(e) => setManualOvers(e.target.value)}
                  placeholder="e.g. 11.3"
                  aria-invalid={!!manualOversError}
                  className={manualOversError ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {manualOversError ? (
                  <p className="text-xs text-destructive">{manualOversError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Format: completed overs.balls into the current over (0–5), e.g. 11.3
                  </p>
                )}
              </div>
              {hasMatchData && (
                <p className="text-xs text-destructive">
                  This replaces the current match data and clears this over's ball-by-ball and undo history.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManualEntry(false)}>
                Cancel
              </Button>
              <Button onClick={applyManualEntry} disabled={!canApplyManual}>
                {hasMatchData ? 'Overwrite & set' : 'Set score'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* All Out (innings over) */}
        <Dialog open={showAllOutDialog} onOpenChange={setShowAllOutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warning size={20} className="text-destructive" />
                All out!
              </DialogTitle>
              <DialogDescription>
                10 wickets have fallen — the innings is over.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 text-center">
              <div className="text-3xl font-bold text-primary">
                {scoringEnabled ? `${runs}/${wickets}` : `${wickets} all out`}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {overs}.{balls} overs
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAllOutDialog(false)}>
                Close
              </Button>
              <Button onClick={resetCounters}>
                <ArrowCounterClockwise size={16} className="mr-1" />
                New innings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default App