# Cricket Umpire Counter

A mobile-friendly cricket umpire counter application for tracking balls, overs, and wickets during cricket matches.

## 🚀 Live Demo

The app is automatically deployed to GitHub Pages: **[https://jtracey93.github.io/cricket-umpire-counter/](https://jtracey93.github.io/cricket-umpire-counter/)**

## Features

- **Ball Counting**: Track balls bowled in the current over (0-6)
- **Over Tracking**: Monitor complete overs with automatic progression
- **Wicket Counter**: Keep track of wickets taken
- **Extras Handling**: Support for wides and no-balls with configurable rebowl rules
- **Persistent State**: Data persists across browser sessions using localStorage
- **Undo Functionality**: Undo last actions with comprehensive history
- **Settings**: Configure wide and no-ball rebowl rules
- **Mobile Optimized**: PWA-ready with responsive design
- **Delivery Sequence**: Visual tracking of deliveries in the current over

## Development

### Prerequisites
- Node.js 20 or higher
- npm

### Getting Started

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

## Deployment

The app automatically deploys to GitHub Pages on every push to the `main` branch. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed information about the deployment process.

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Phosphor Icons** - Icon system
- **GitHub Actions** - CI/CD for deployment
- **GitHub Pages** - Hosting

## 📄 License 

The Cricket Umpire Counter files and resources are licensed under the terms of the MIT license, Copyright GitHub, Inc.