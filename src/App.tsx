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
  Settings, 
  RotateCcw, 
  Target, 
  Undo2,
  Plus
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

type DeliveryType = 'legal' | 'wide' | 'no-ball'

interface LastAction {
  type: 'delivery' | 'wicket' | 'reset'
  deliveryType?: DeliveryType
  ballsBefore: number
  oversBefore: number
  wicketsBefore: number
}

function App() {
  // Persistent state using useKV
  const [balls, setBalls] = useKV('cricket-balls', 0)
  const [overs, setOvers] = useKV('cricket-overs', 0)  
  const [wickets, setWickets] = useKV('cricket-wickets', 0)
  const [widesRebowled, setWidesRebowled] = useKV('wides-rebowled', true)
  const [noBallsRebowled, setNoBallsRebowled] = useKV('noballs-rebowled', true)
  
  // Local state for last action (doesn't need persistence)
  const [lastAction, setLastAction] = useState<LastAction | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const ballsRemaining = 6 - balls
  const isOverComplete = balls >= 6

  const recordDelivery = (type: DeliveryType) => {
    // Record the action for undo
    setLastAction({
      type: 'delivery',
      deliveryType: type,
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets
    })

    let shouldIncrementBall = true

    // Apply rebowl rules
    if (type === 'wide' && widesRebowled) {
      shouldIncrementBall = false
    } else if (type === 'no-ball' && noBallsRebowled) {
      shouldIncrementBall = false
    }

    if (shouldIncrementBall) {
      setBalls((currentBalls) => {
        const newBalls = currentBalls + 1
        // Check if over is complete
        if (newBalls >= 6) {
          setOvers((currentOvers) => currentOvers + 1)
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
      wicketsBefore: wickets
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
      toast.info('Delivery undone')
    } else if (lastAction.type === 'wicket') {
      setBalls(lastAction.ballsBefore)
      setOvers(lastAction.oversBefore)  
      setWickets(lastAction.wicketsBefore)
      toast.info('Wicket undone')
    }
    
    setLastAction(null)
  }

  const resetCounters = () => {
    setLastAction({
      type: 'reset',
      ballsBefore: balls,
      oversBefore: overs,
      wicketsBefore: wickets
    })
    
    setBalls(0)
    setOvers(0)
    setWickets(0)
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
              <Undo2 size={20} />
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Settings size={20} />
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