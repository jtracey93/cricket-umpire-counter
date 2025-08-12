# Cricket Umpire Counter

A professional mobile-optimized cricket umpiring tool for tracking balls, overs, and wickets during live matches. Designed with cricket officials in mind, this Progressive Web App (PWA) provides reliable, efficient counting with customizable rules for different cricket formats.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](#)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)](#)


## 🚀 Live Demo

The app is automatically deployed to GitHub Pages with a custom domain: **[https://clicker.poyningscc.co.uk](https://clicker.poyningscc.co.uk)**

## Features

### 🏏 Core Umpiring Functions
- **Ball Counter**: Track individual balls within an over (1-6) with proper extra handling
- **Over Counter**: Automatic over progression when 6 legal balls are completed
- **Wicket Counter**: Independent wicket tracking throughout the innings
- **Current Over Details**: Visual breakdown of deliveries, extras, and wickets in the current over

### ⚙️ Customizable Rules
- **Wide Ball Rules**: Toggle whether wides consume balls from the over or are re-bowled
- **No-Ball Rules**: Configure no-ball handling to match different cricket formats
- **Format Flexibility**: Adapts to various cricket formats and local rule variations

### 🔄 Smart Controls
- **Undo Functionality**: Reverse the last action with full state restoration
- **Over Confirmation**: Confirmation dialog when 6 legal balls are reached
- **Reset with Confirmation**: Safe match/innings restart with accidental reset prevention
- **Delivery Sequence**: Visual representation of each delivery in the current over


### 📱 Mobile-First Design
- **Touch Optimized**: Large finger-friendly buttons (60px minimum) for outdoor use
- **High Contrast**: Cricket-themed colors optimized for bright sunlight
- **PWA Support**: Install on mobile devices for offline use
- **Professional Interface**: Clean, authoritative design that inspires confidence

### 💾 Persistent State

- **Auto-save**: All data persists across app restarts and browser sessions using localStorage
- **Session Recovery**: Continue matches after device sleep or app backgrounding
- **Action History**: Track up to 10 recent actions for comprehensive undo support

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/jtracey93/cricket-umpire-counter.git
cd cricket-umpire-counter

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### PWA Installation
Visit the deployed app in your mobile browser and use "Add to Home Screen" for the best experience.

## Usage

### Basic Operation
1. **Start New Match**: Use "Reset All" to clear all counters
2. **Record Deliveries**: 
   - Tap "Legal Delivery" for standard balls
   - Use "Wide" or "No-ball" for extras (respects your rule settings)
   - Tap "Wicket" for dismissals
3. **Over Completion**: Confirm when 6 legal balls are reached to advance to the next over
4. **Undo Mistakes**: Use the undo button to reverse the last action

### Settings Configuration
- Access settings via the gear icon in the top-right
- Toggle wide and no-ball rebowl rules to match your format
- Settings are saved automatically and persist between sessions

### Rule Examples
- **International Cricket**: Wides and no-balls are typically re-bowled
- **Some Local Formats**: Extras may count toward the 6-ball over limit
- **Custom Rules**: Configure based on your specific match requirements

## Deployment

The app automatically deploys to GitHub Pages on every push to the `main` branch. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information about the deployment process.

## Technical Details

### Built With
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom cricket-themed colors

- **State Management**: localStorage-based persistence with custom useKV hook
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Phosphor Icons for consistent iconography
- **Deployment**: GitHub Actions for CI/CD to GitHub Pages

### Architecture
- **Component Structure**: Modular React components with proper separation of concerns  
- **State Persistence**: Browser-based localStorage with automatic serialization
- **Error Handling**: React Error Boundary for graceful failure recovery
- **Responsive Design**: Mobile-first with landscape mode support

### Key Files
- `src/App.tsx` - Main application component with all umpiring logic
- `src/hooks/useKV.ts` - Custom localStorage persistence hook
- `public/manifest.json` - PWA configuration for mobile installation
- `PRD.md` - Comprehensive product requirements and design specification
- `src/components/ui/` - Reusable UI components
- `.github/workflows/deploy-pages.yml` - GitHub Actions deployment workflow

## Color Scheme

The app uses cricket-inspired colors optimized for outdoor visibility:

- **Primary**: Deep Cricket Green `oklch(0.45 0.15 142)` - Field heritage
- **Background**: Clean White `oklch(0.98 0 0)` - Maximum legibility  
- **Text**: Charcoal `oklch(0.25 0 0)` - High contrast
- **Accent**: Bright Orange `oklch(0.7 0.2 65)` - Alerts and active states

All color combinations meet WCAG accessibility standards with contrast ratios above 4.5:1.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes with proper TypeScript types
4. Test thoroughly on mobile devices
5. Submit a pull request with a clear description

### Development Guidelines
- Follow the existing TypeScript patterns
- Maintain mobile-first responsive design
- Test with actual cricket scenarios
- Ensure all state changes are properly persisted
- Keep the professional, minimal aesthetic

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the needs of cricket officials worldwide
- Designed for reliability during critical match moments
- Built with modern web technologies for optimal performance

---

*Perfect for cricket umpires, scorers, and officials at all levels - from local club matches to professional games.*