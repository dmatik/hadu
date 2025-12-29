# HADU

HA Dashboard UI - A localized, AI-powered dashboard for Home Assistant.

## Overview

HADU is a web application designed to provide a smart interface for your Home Assistant setup. It features:
- Real-time weather updates.
- Time and date display.
- Control for lights and appliances.
- Integration with Home Assistant via WebSocket.
- AI-enhanced features (to be developed).

## Getting Started

### Prerequisites

- Node.js
- Home Assistant instance running locally.

### Configuration

You can configure the Home Assistant connection using environment variables.
Create a `.env` file in the root directory (copy `.env.example`):

```ini
HA_HOST=http://homeassistant.local:8123
HA_TOKEN=your_long_lived_access_token
```

Alternatively, you can manually input these details in the application UI (stored in Local Storage).


### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```
