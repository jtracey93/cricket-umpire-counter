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
  RotateCcw, 
  Target, 
  ArrowCounterClockwise,
  Plus
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

type DeliveryType = 'legal' | 'wide' | 'no-ball'

interface DeliveryRecord {
  type: DeliveryType
  ballNumber: number // The ball number in this over when this delivery was made
}

interface LastAction {
  type: 'delivery' | 'wicket' | 'reset'
  deliveryType?: DeliveryType
  ballsBefore: number
  oversBefore: number
  wicketsBefore: number
  currentOverDeliveriesBefore: DeliveryRecord[]
}

function App() {
  // Persistent state using useKV
  const [balls, setBalls] = useKV('cricket-balls', 0)
  const [overs, setOvers] = useKV('cricket-overs', 0)  
  const [wickets, setWickets] = useKV('cricket-wickets', 0)
  const [widesRebowled, setWidesRebowled] = useKV('wides-rebowled', true)
  const [noBallsRebowled, setNoBallsRebowled] = useKV('noballs-rebowled', true)
  const [currentOverDeliveries, setCurrentOverDeliveries] = useKV<DeliveryRecord[]>('current-over-deliveries', [])
  
  // Local state for last action (doesn't need persistence)
  const [lastAction, setLastAction] = useState<LastAction | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const ballsRemaining = 6 - balls
  const isOverComplete = balls >= 6
  const totalDeliveriesInOver = currentOverDeliveries.length
  const legalDeliveriesInOver = currentOverDeliveries.filter(d => d.type === 'legal').length
  const widesInOver = currentOverDeliveries.filter(d => d.type === 'wide').length
  const noBallsInOver = currentOverDeliveries.filter(d => d.type === 'no-ball').length

  const recordDelivery = (type: DeliveryType) => {
    // Record the action for undo
    setLastAction({
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
        // Check if over is complete
        if (newBalls >= 6) {
          setOvers((currentOvers) => currentOvers + 1)
          // Reset deliveries tracking for new over
          setCurrentOverDeliveries([])
          toast.success('Over Complete!')
          return 0 // Reset balls to 0
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
    setLastAction({
      type: 'wicket', 
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets,
      currentOverDeliveriesBefore: [...currentOverDeliveries]
    })
    
    setWickets((currentWickets) => currentWickets + 1)
    toast.success('Wicket!')
  }

  const undoLastAction = () => {
    if (!lastAction) return

    if (lastAction.type === 'delivery') {
      setBalls(lastAction.ballsBefore)
      setOvers(lastAction.oversBefore)
      setWickets(lastAction.wicketsBefore)
      setCurrentOverDeliveries(lastAction.currentOverDeliveriesBefore)
      toast.info('Delivery undone')
    } else if (lastAction.type === 'wicket') {
      setBalls(lastAction.ballsBefore)
      setOvers(lastAction.oversBefore)  
      setWickets(lastAction.wicketsBefore)
      setCurrentOverDeliveries(lastAction.currentOverDeliveriesBefore)
      toast.info('Wicket undone')
    } else if (lastAction.type === 'reset') {
      setBalls(lastAction.ballsBefore)
      setOvers(lastAction.oversBefore)
      setWickets(lastAction.wicketsBefore)
      setCurrentOverDeliveries(lastAction.currentOverDeliveriesBefore)
      toast.info('Reset undone')
    }
    
    setLastAction(null)
  }

  const resetCounters = () => {
    setLastAction({
      type: 'reset',
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets,
      currentOverDeliveriesBefore: [...currentOverDeliveries]
    })
    
    setBalls(0)
    setOvers(0)
    setWickets(0)
    setCurrentOverDeliveries([])
    setShowResetDialog(false)
    toast.success('Counters reset')
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Cricket Umpire</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={undoLastAction}
              disabled={!lastAction}
              className="h-10 w-10"
            >
              <ArrowCounterClockwise size={20} />
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Gear size={20} />
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
        </div>

        {/* Main Counters */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center text-muted-foreground">Balls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{balls}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ballsRemaining} remaining
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center text-muted-foreground">Overs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{overs}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {overs}.{balls}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-center text-muted-foreground">Wickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{wickets}</div>
                <div className="text-xs text-muted-foreground mt-1">
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
        {totalDeliveriesInOver > 0 && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-center">Current Over Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-lg font-semibold text-primary">{totalDeliveriesInOver}</div>
                  <div className="text-xs text-muted-foreground">Total deliveries</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-primary">{legalDeliveriesInOver}</div>
                  <div className="text-xs text-muted-foreground">Legal balls</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-accent">{widesInOver + noBallsInOver}</div>
                  <div className="text-xs text-muted-foreground">Extras</div>
                </div>
              </div>
              
              {(widesInOver > 0 || noBallsInOver > 0) && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex justify-center gap-4 text-xs">
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
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2 text-center">Delivery sequence:</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {currentOverDeliveries.map((delivery, index) => (
                    <Badge 
                      key={index}
                      variant={delivery.type === 'legal' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        delivery.type === 'legal' ? 'bg-primary text-primary-foreground' :
                        delivery.type === 'wide' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-orange-200 text-orange-800'
                      }`}
                    >
                      {delivery.type === 'legal' ? '•' : 
                       delivery.type === 'wide' ? 'W' : 'NB'}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delivery Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center">Record Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              size="lg" 
              className="w-full h-16 text-lg font-semibold"
              onClick={() => recordDelivery('legal')}
            >
              Legal Delivery
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="secondary"
                size="lg" 
                className="h-14 text-base"
                onClick={() => recordDelivery('wide')}
              >
                Wide
                {widesRebowled && (
                  <Badge variant="outline" className="ml-2 text-xs">Re-bowl</Badge>
                )}
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                className="h-14 text-base"
                onClick={() => recordDelivery('no-ball')}
              >
                No-ball
                {noBallsRebowled && (
                  <Badge variant="outline" className="ml-2 text-xs">Re-bowl</Badge>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Wicket and Reset */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            size="lg"
            variant="default"
            className="h-14 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={recordWicket}
          >
            <Target size={20} className="mr-2" />
            Wicket
          </Button>

          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                variant="destructive"
                className="h-14"
              >
                <RotateCcw size={20} className="mr-2" />
                Reset
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

        {/* Current Settings Display */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="text-sm space-y-2">
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