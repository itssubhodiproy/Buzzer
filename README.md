# Quiz Buzzer System Setup Guide

## 📁 File Structure
```
quiz-buzzer/
├── server.js
├── package.json
└── public/
    └── index.html
```

## 🚀 Quick Setup

### 1. Install Node.js
- Download from: https://nodejs.org (LTS version)
- Verify: `node --version` and `npm --version`

### 2. Create Project
```bash
mkdir quiz-buzzer
cd quiz-buzzer
```

### 3. Save Files
- Save `server.js` in root folder
- Save `package.json` in root folder
- Create `public` folder
- Save `index.html` inside `public` folder

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Server
```bash
npm start
```

You'll see:
```
Server running on port 3000
Find your IP and share: http://YOUR_IP:3000
```

## 📱 Network Setup

### Option 1: Phone Hotspot (Recommended)
1. **Create hotspot** on any Android phone (data OFF)
2. **Connect laptop** to hotspot
3. **Find laptop IP**:
   - Windows: `ipconfig` → Wireless LAN adapter → IPv4 Address
   - Mac/Linux: `ifconfig` or `ip addr`
4. **All phones connect** to same hotspot
5. **Share URL**: `http://192.168.x.x:3000` (your laptop IP)

### Option 2: Laptop Hotspot
1. **Windows**: Settings → Network → Mobile Hotspot
2. **Mac**: System Preferences → Sharing → Internet Sharing
3. **All phones connect** to laptop hotspot
4. **Use**: `http://192.168.137.1:3000`

## 🎮 How to Use

### Contestants (6 phones):
1. Open browser → Go to server URL
2. Click **"Contestant"**
3. Select your number (1-6)
4. Big BUZZ button appears
5. Press to buzz!

### Admin (1 phone/laptop):
1. Open browser → Go to server URL
2. Click **"Admin"**
3. See all 6 contestant cards
4. When someone buzzes:
   - Hear "BOP" sound
   - Their number lights up gold
5. Click **"Reset Buzzers"** after answer

## ✨ Features

- ✅ **localStorage persistence** - Number saved if app closes
- ✅ **Auto-reconnect** - Handles connection drops
- ✅ **Instant lock** - First buzzer disables others
- ✅ **Visual + Audio feedback** - BOP sound + golden highlight
- ✅ **Responsive design** - Works on all screen sizes
- ✅ **No internet needed** - Pure local network

## 🔧 Troubleshooting

### Can't connect from phones?
- Check all devices on same WiFi
- Check firewall (Windows may block port 3000)
- Try: `http://192.168.x.x:3000` with correct IP

### No sound on admin?
- Click anywhere on page first (browser audio policy)
- Check volume not muted

### Buzzer not working?
- Check WebSocket connection (green dot on admin)
- Refresh page
- Check server still running

## 🎯 Tips

- Keep hotspot phone plugged in (battery drain)
- Test with 2 phones before full setup
- Bookmark URL on all phones for quick access
- Admin should test audio before quiz starts

## 📝 Notes

- **Latency**: 20-50ms (excellent for quiz)
- **Range**: 10-15 meters (typical WiFi hotspot)
- **Data usage**: ZERO (all local)
- **Battery**: Moderate drain on hotspot phone

Enjoy your quiz! 🎉
