import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
  Plus
} from '@phosphor-icons/react'
import { useKV } from './hooks/useKV'
import { toast } from 'sonner'

type DeliveryType = 'legal' | 'wide' | 'no-ball' | 'wicket'

interface DeliveryRecord {
  type: DeliveryType
  ballNumber: number // The ball number in this over when this delivery was made
}

interface Action {
  id: string
  type: 'delivery' | 'wicket' | 'reset'
  deliveryType?: DeliveryType
  ballsBefore: number
  oversBefore: number
  wicketsBefore: number
  currentOverDeliveriesBefore: DeliveryRecord[]
  timestamp: number
}

function App() {
  // Persistent state using useKV
  const [balls, setBalls] = useKV('cricket-balls', 0)
  const [overs, setOvers] = useKV('cricket-overs', 0)  
  const [wickets, setWickets] = useKV('cricket-wickets', 0)
  const [widesRebowled, setWidesRebowled] = useKV('wides-rebowled', true)
  const [noBallsRebowled, setNoBallsRebowled] = useKV('noballs-rebowled', true)
  const [currentOverDeliveries, setCurrentOverDeliveries] = useKV<DeliveryRecord[]>('current-over-deliveries', [])
  const [actionHistory, setActionHistory] = useKV<Action[]>('action-history', [])
  
  // Local state for dialogs (doesn't need persistence)
  const [lastAction, setLastAction] = useState<Action | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showOverCompleteDialog, setShowOverCompleteDialog] = useState(false)

  const ballsRemaining = 6 - balls
  const isOverComplete = balls >= 6
  const isAwaitingOverConfirmation = balls >= 6 && showOverCompleteDialog
  const totalDeliveriesInOver = currentOverDeliveries.length
  const legalDeliveriesInOver = currentOverDeliveries.filter(d => d.type === 'legal' || d.type === 'wicket').length
  const widesInOver = currentOverDeliveries.filter(d => d.type === 'wide').length
  const noBallsInOver = currentOverDeliveries.filter(d => d.type === 'no-ball').length
  const wicketsInOver = currentOverDeliveries.filter(d => d.type === 'wicket').length
  const canUndo = actionHistory.length > 0

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

  const recordDelivery = (type: DeliveryType) => {
    // Record the action for undo
    addToHistory({
      type: 'delivery',
      deliveryType: type,
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets,
      currentOverDeliveriesBefore: [...currentOverDeliveries]
    })

    let shouldIncrementBall = true

    // Apply rebowl rules
    if (type === 'wide' && widesRebowled) {
      shouldIncrementBall = false
    } else if (type === 'no-ball' && noBallsRebowled) {
      shouldIncrementBall = false
    }

    // Add delivery to current over tracking
    const newDelivery: DeliveryRecord = {
      type,
      ballNumber: totalDeliveriesInOver + 1
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
      toast.success('Legal delivery')
    } else if (type === 'wide') {
      toast.warning(`Wide ${widesRebowled ? '(re-bowled)' : ''}`)
    } else if (type === 'no-ball') {
      toast.warning(`No-ball ${noBallsRebowled ? '(re-bowled)' : ''}`)
    }
  }

  const recordWicket = () => {
    addToHistory({
      type: 'wicket', 
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets,
      currentOverDeliveriesBefore: [...currentOverDeliveries]
    })
    
    // Add wicket delivery to current over tracking as a wicket type
    const newDelivery: DeliveryRecord = {
      type: 'wicket',
      ballNumber: totalDeliveriesInOver + 1
    }
    
    setCurrentOverDeliveries((current) => [...current, newDelivery])
    
    // Increment wickets
    setWickets((currentWickets) => currentWickets + 1)
    
    // Increment balls (wicket counts as a legal delivery)
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
    
    toast.success('Wicket! (Legal delivery)')
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
    setCurrentOverDeliveries(actionToUndo.currentOverDeliveriesBefore)
    
    // Close any open dialogs that might be affected
    setShowOverCompleteDialog(false)
    
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
    setCurrentOverDeliveries([])
    setActionHistory([])
    setLastAction(null)
    setShowResetDialog(false)
    toast.success('Counters and history reset')
  }

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
                  Configure wide and no-ball rules
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
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
        {isOverComplete && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              Over Complete - Ready for Next Over
            </Badge>
          </div>
        )}

        {/* Current Over Details */}
        <Card className="bg-muted/30 py-2 sm:py-6 gap-1 sm:gap-6">
          <CardHeader className="pb-1 sm:pb-3 px-2 sm:px-6">
            <CardTitle className="text-sm text-center">Current Over Details</CardTitle>
          </CardHeader>
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
                    {currentOverDeliveries.map((delivery, index) => (
                      <Badge 
                        key={index}
                        variant={delivery.type === 'legal' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          delivery.type === 'legal' ? 'bg-primary text-primary-foreground' :
                          delivery.type === 'wicket' ? 'bg-accent text-accent-foreground' :
                          delivery.type === 'wide' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-orange-200 text-orange-800'
                        }`}
                      >
                        {delivery.type === 'legal' ? '•' : 
                         delivery.type === 'wicket' ? 'W' :
                         delivery.type === 'wide' ? 'Wd' : 'NB'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {totalDeliveriesInOver === 0 && (
                <div className="text-center text-sm text-muted-foreground py-1 sm:py-2">
                  No deliveries yet this over
                </div>
              )}
            </CardContent>
          </Card>

        {/* Delivery Buttons */}
        <Card className="py-2 sm:py-6 gap-2 sm:gap-6">
          <CardHeader className="pb-1 sm:pb-4 px-2 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-center">Record Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-4 px-2 sm:px-6">
            <Button 
              size="lg" 
              className="w-full h-10 sm:h-16 text-base sm:text-lg font-semibold"
              onClick={() => recordDelivery('legal')}
              disabled={isAwaitingOverConfirmation}
            >
              Legal Delivery
            </Button>
            
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              <div className="flex flex-col items-center gap-1">
                <Button 
                  size="lg" 
                  className="w-full h-8 sm:h-14 text-sm sm:text-base bg-yellow-500 text-white hover:bg-yellow-600"
                  onClick={() => recordDelivery('wide')}
                  disabled={isAwaitingOverConfirmation}
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
                  disabled={isAwaitingOverConfirmation}
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
                disabled={isAwaitingOverConfirmation}
              >
                <Target size={14} className="mr-1 sm:mr-2 sm:size-5" />
                <span className="text-sm sm:text-base">Wicket</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Undo and Reset Buttons */}
        <div className="flex flex-col gap-1.5 sm:gap-3">
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
                    This will reset balls, overs, and wickets to zero. This action can be undone.
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
                <span>Wides:</span>
                <span className={widesRebowled ? "text-accent" : "text-muted-foreground"}>
                  {widesRebowled ? "Re-bowled" : "Count as ball"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>No-balls:</span>
                <span className={noBallsRebowled ? "text-accent" : "text-muted-foreground"}>
                  {noBallsRebowled ? "Re-bowled" : "Count as ball"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App