# Cricket Umpire Counter - Product Requirements Document

A mobile-optimized cricket umpiring tool that tracks balls, overs, wickets — and, with optional scoring mode, the running team total — with customizable wide and no-ball handling rules.

**Experience Qualities**: 
1. **Reliable** - Accurate counting with clear visual feedback for critical match decisions
2. **Efficient** - Quick access to essential controls without fumbling during live play
3. **Professional** - Clean, focused interface that inspires confidence in match officials

**Complexity Level**: Light Application (multiple features with basic state)
- Simple but comprehensive tracking with persistent state management across sessions and customizable rule toggles

## Essential Features

**Ball Counter**
- Functionality: Track individual balls within an over (1-6), handle extras (wides/no-balls)
- Purpose: Core umpiring requirement for over completion and match progression
- Trigger: Large touch buttons for legal delivery, wide, or no-ball
- Progression: Tap delivery type → Visual confirmation → Counter updates → Auto-advance to next over at 6 legal balls
- Success criteria: Accurate ball counting with proper extra handling based on toggle settings

**Over Counter**  
- Functionality: Track completed overs throughout the match
- Purpose: Monitor match progression and innings structure
- Trigger: Automatic increment when 6 legal balls are bowled
- Progression: 6th legal ball → Over increments → Ball counter resets → Visual transition feedback
- Success criteria: Seamless over transitions with persistent count

**Wicket Counter**
- Functionality: Track dismissals throughout the innings, capped at 10 (a full team)
- Purpose: Monitor team's remaining batsmen and innings conclusion
- Trigger: Dedicated wicket button for dismissals
- Progression: Dismissal occurs → Tap wicket button → Counter increments → Visual confirmation. On the 10th wicket an "All out" popup confirms the innings is over and delivery buttons lock until reset/undo/resume.
- Success criteria: Accurate wicket tracking independent of ball count; never exceeds 10; all-out is clearly signalled

**Optional Scoring Mode**
- Functionality: Track the running team total (runs / wickets) alongside overs, making the app engaging enough to score with while umpiring. On by default; easily turned off in Settings.
- Purpose: Let umpires keep the score as well as officiate, without forcing it on those who only want ball/over/wicket counting.
- Trigger: "Scoring mode" switch in Settings (default on).
- Progression:
  - **On**: The single "Legal Delivery" button is replaced by run buttons (`• 1 2 3 4 6` plus `5+` for unusual scores). Wide / No-ball / Bye / Leg-bye each open a quick run picker for runs taken. Wides and no-balls add a configurable penalty (default 1 run, set beside the re-bowl toggles). A prominent scoreboard shows `runs/wickets`, overs and current run rate, and the delivery-sequence chips show runs (e.g. `4`, `•`, `Wd+1`, `Nb+2`, `B2`, `Lb1`, `W`). To save space, the **Current Over Details** card is collapsed by default in scoring mode (tap its header to expand; a compact summary is shown while collapsed). When an over completes, the confirmation dialog also shows the **runs scored that over** and the **score total** (`runs/wickets`) while scoring is on.
  - **Off**: The app behaves exactly as before — a single "Legal Delivery" button with Wide / No-ball / Wicket, no runs and no scoreboard, and the Current Over Details card expanded.
- Success criteria: With scoring off the experience is unchanged; with scoring on the team total updates correctly for runs, extras (penalty + runs run), byes and leg-byes, and is restored by Undo.

**Manual Set / Resume Score (mid-innings pickup)**
- Functionality: Manually enter the current runs (when scoring on), wickets and overs (in `overs.balls` notation, e.g. `11.3`) so an umpire can pick up part-way through an innings.
- Purpose: Officials often take over mid-innings and need to start from the current match state, not zero.
- Trigger: "Set / Resume Score" button on the main screen and a matching link in Settings.
- Progression: Open dialog → Enter runs / wickets / overs → Inline validation flags bad input live (wickets must be less than 10; overs in `overs.balls` with balls 0–5, so `12.6` or `11.9` are rejected; runs ≥ 0) and the confirm button stays disabled until all fields are valid → Existing data triggers an overwrite warning → Confirm → State is set and the current over's ball-by-ball and undo history are cleared (prior detail is unknown).
- Success criteria: The score, wickets and overs.balls reflect the entered values, impossible values cannot be submitted, and play continues correctly from that point.

**Wide/No-Ball Rule Toggle**
- Functionality: Configure whether wides and no-balls consume balls from the over
- Purpose: Adapt to different cricket formats and local rule variations
- Trigger: Settings toggle accessed from main interface
- Progression: Access settings → Toggle wide/no-ball re-bowl rules → Confirm selection → Rules apply immediately
- Success criteria: Consistent rule application affecting ball progression logic

**Reset Functionality**
- Functionality: Clear all counters to start fresh innings/match
- Purpose: Quick setup for new innings or match restart
- Trigger: Reset button with confirmation dialog
- Progression: Tap reset → Confirm action → All counters return to zero → Ready for new play
- Success criteria: Complete state clearing with accidental reset prevention

## Edge Case Handling

- **Innings complete (all out)** - Cap wickets at 10; on the 10th wicket show an "All out" popup and lock deliveries until reset, undo or resume
- **Impossible manual entry** - Reject more than 9 wickets and invalid overs (e.g. `12.6`, `11.9`) inline before they can be applied
- **Multiple extras in sequence** - Handle consecutive wides/no-balls without breaking over logic
- **Accidental taps** - Provide undo functionality for the last action taken
- **App backgrounding** - Persist all counter state when app loses focus
- **Screen rotation** - Maintain usability in portrait and landscape orientations
- **Battery optimization** - Prevent OS from killing the app during active matches

## Design Direction

The interface should feel authoritative and professional, like a precision sporting instrument - clean lines, high contrast, and immediate tactile feedback that inspires confidence during crucial match moments. Minimal interface that prioritizes function over form.

## Color Selection

Complementary (opposite colors) - Using cricket's traditional green field with high-contrast white for maximum legibility under various lighting conditions including bright outdoor sunlight.

- **Primary Color**: Deep Cricket Green `oklch(0.45 0.15 142)` - Represents the playing field and cricket heritage
- **Secondary Colors**: Clean White `oklch(0.98 0 0)` and Charcoal `oklch(0.25 0 0)` for contrast and readability
- **Accent Color**: Bright Orange `oklch(0.7 0.2 65)` - High visibility for alerts, warnings, and active states
- **Foreground/Background Pairings**: 
  - Background White `oklch(0.98 0 0)`: Charcoal text `oklch(0.25 0 0)` - Ratio 8.2:1 ✓
  - Primary Green `oklch(0.45 0.15 142)`: White text `oklch(0.98 0 0)` - Ratio 5.1:1 ✓
  - Accent Orange `oklch(0.7 0.2 65)`: Charcoal text `oklch(0.25 0 0)` - Ratio 4.8:1 ✓

## Font Selection

Typography should convey authority and precision with excellent legibility in outdoor conditions - using Inter for its optimized screen readability and professional sporting aesthetic.

- **Typographic Hierarchy**: 
  - H1 (Counter Numbers): Inter Bold/48px/tight letter spacing for maximum legibility
  - H2 (Section Labels): Inter Semibold/24px/normal spacing for clear identification  
  - H3 (Button Labels): Inter Medium/18px/wide letter spacing for touch precision
  - Body (Settings): Inter Regular/16px/normal spacing for secondary information

## Animations

Subtle and functional animations that provide immediate feedback without delaying critical umpiring decisions - quick confirmation pulses and smooth counter transitions.

- **Purposeful Meaning**: Quick haptic-style pulses confirm button presses, gentle counter increments show progression
- **Hierarchy of Movement**: Counter changes get priority animation, secondary elements fade/slide smoothly

## Component Selection

- **Components**: Card for main counter display, Button variants for different actions (primary for legal balls, destructive for reset, secondary for extras), Switch for rule toggles, Dialog for confirmations, Badge for counter displays
- **Customizations**: Oversized touch targets (minimum 60px) for outdoor use with gloves, high contrast button states
- **States**: Clear pressed/active states with tactile feedback, disabled states for invalid actions, loading states for state persistence
- **Icon Selection**: Plus/Minus for counters, Settings gear for configuration, RotateCcw for reset, Target for wickets
- **Spacing**: Generous padding (p-6, p-8) for comfortable thumb navigation, consistent gaps (gap-4, gap-6) between control groups
- **Mobile**: Portrait-first design with large finger-friendly buttons, landscape mode maintains usability with horizontal layout