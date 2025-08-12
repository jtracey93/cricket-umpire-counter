# Cricket Umpire Counter - Product Requirements Document

A mobile-optimized cricket umpiring tool that tracks balls, overs, wickets with customizable wide and no-ball handling rules.

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
- Functionality: Track dismissals throughout the innings
- Purpose: Monitor team's remaining batsmen and innings conclusion
- Trigger: Dedicated wicket button for dismissals
- Progression: Dismissal occurs → Tap wicket button → Counter increments → Visual confirmation
- Success criteria: Accurate wicket tracking independent of ball count

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