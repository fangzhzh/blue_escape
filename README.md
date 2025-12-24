# Blue Escape 🎮

A first-person adventure voxel game built with Three.js. Explore a vast procedurally generated world and battle epic boss monsters to claim the treasure!

![Game Status](https://img.shields.io/badge/Status-Playable-brightgreen) ![FPS](https://img.shields.io/badge/FPS-60+-green)

## 🎯 Game Objective

Defeat the **Fire Dragon** 🐉 and **Fire Jellyfish** 🪼 to unlock treasure boxes and achieve victory!

## ✨ Features

### World & Exploration
- **Massive 100×100 block world** with varied terrain
- **Procedural generation** with forests, mountains, and open fields
- **Dynamic lighting** with real-time shadows
- **Distance fog** for atmospheric depth

### Boss Battles
- **Fire Dragon**: Flies around, shoots fireballs (20 damage), 200 HP
- **Fire Jellyfish**: Floats and bounces, electric shock attacks (15 damage), 200 HP
- **Boss AI**: Patrol patterns, aggro system, unique attack behaviors

### Combat System
- **Projectile attacks**: Shoot cyan energy bolts (25 damage)
- **Attack cooldown**: 0.5 seconds between shots
- **Visual effects**: Hit particles, damage numbers, electric lightning
- **Health system**: 100 HP with color-coded health bar

### Polish
- **Modern UI**: Health bars, objective tracker, boss status
- **Victory/Defeat screens** with restart option
- **FPS counter** with performance monitoring
- **Smooth controls** with physics and collision

## 🚀 Quick Start

### Run the Game

```bash
# Start local server (if not already running)
python3 -m http.server 8000

# Open in browser
# Navigate to: http://localhost:8000
```

### How to Play

1. **Open** `http://localhost:8000` in your browser
2. **Move** with WASD immediately (no click needed!)
3. **Click** to lock mouse for camera control
4. **Fight** bosses and claim victory!

## 🎮 Controls

| Action | Input | Notes |
|--------|-------|-------|
| Move Forward | <kbd>W</kbd> | Works immediately |
| Move Left | <kbd>A</kbd> | Works immediately |
| Move Backward | <kbd>S</kbd> | Works immediately |
| Move Right | <kbd>D</kbd> | Works immediately |
| Jump | <kbd>Space</kbd> | Works immediately |
| Look Around | Mouse | Click to lock first |
| Attack | Left Click | Shoot projectiles |
| Pause | <kbd>ESC</kbd> | Release mouse lock |

> 💡 **Tip**: You can move with WASD right away! Click anywhere to lock the mouse for camera control.

## 🐉 Boss Guide

### Fire Dragon
- **Location**: Northeast region (30, 15, 30)
- **Appearance**: Red dragon with wings and tail
- **Health**: 200 HP
- **Behavior**: 
  - Flies in circles when idle
  - Chases player within 20 blocks
  - Shoots fireballs every 2 seconds
- **Strategy**: Keep moving to dodge fireballs, shoot while backing up

### Fire Jellyfish  
- **Location**: Southwest region (-30, 8, -30)
- **Appearance**: Pink translucent jellyfish with tentacles
- **Health**: 200 HP
- **Behavior**:
  - Bounces and rotates continuously
  - Moves toward player within 15 blocks
  - Electric shock every 3 seconds (8 block radius)
- **Strategy**: Hit from distance, retreat when it gets close

### Treasure Boxes
- **Count**: 2 (one near each boss)
- **Status**: Locked until both bosses defeated
- **Victory**: Approach after defeating bosses to win!

## 🛠️ Technical Details

### Technology Stack
- **Three.js** v0.160.0 - 3D rendering engine
- **Vanilla JavaScript** - ES6 modules
- **Pointer Lock API** - Optional mouse control
- **HTML5 Canvas** - Rendering surface

### Project Structure
```
minegraft_game/
├── index.html      # Entry point with UI elements
├── style.css       # Modern UI styling
├── game.js         # Game engine & state management
├── world.js        # Procedural terrain generation
├── entities.js     # Boss monsters & treasure boxes
├── combat.js       # Combat system & effects
└── controls.js     # Player movement & physics
```

### Game Specifications
- **World Size**: 100×100 blocks (10,000 blocks total)
- **Player**: 100 HP, 5 units/s speed, 1.8 blocks tall
- **Combat**: 25 damage/shot, 0.5s cooldown, 30 block range
- **Physics**: 20 units/s² gravity, 8 units/s jump velocity
- **Performance**: Optimized for 60 FPS on modern hardware

## 🎨 Features & Polish

### Visual Effects
- Dynamic shadows from sun
- Particle effects on hits
- Floating damage numbers
- Electric lightning for jellyfish
- Glowing projectiles and fireballs

### UI/UX
- Glassmorphism design
- Color-coded health bars (green/yellow/red)
- Real-time boss status tracker
- Smooth animations and transitions
- Clear victory/defeat feedback

### World Generation
- Height variation using sine waves
- Forest zones near spawn
- Mountains in outer regions  
- Procedurally placed trees
- Multiple block types (grass, dirt, stone, wood)

## 🏆 Gameplay Tips

1. **Start Safe**: Spawn in a cleared area with good visibility
2. **Explore**: Get familiar with the terrain before engaging bosses
3. **Focus Fire**: Take down one boss at a time
4. **Keep Distance**: Use your range advantage
5. **Dodge**: Strafe to avoid enemy projectiles
6. **Use Terrain**: Mountains and trees can provide cover
7. **Watch Health**: Retreat if health gets low

## 🐛 Troubleshooting

**Green screen / Can't see**: Refresh the page. Spawn area is automatically cleared.

**Can't move**: Just press WASD - movement works without clicking!

**Low FPS**: Reduce browser window size or close other tabs.

**Bosses not visible**: They spawn at (30, 15, 30) and (-30, 8, -30). Walk around to find them.

## 📝 Version History

### Current Version
- ✅ 100×100 open world
- ✅ 2 boss enemies with AI
- ✅ Full combat system
- ✅ Health and damage tracking
- ✅ Victory/defeat conditions
- ✅ Fixed spawn in clear area
- ✅ **WASD movement without mouse lock**

## 🎯 Future Ideas

- More boss types
- Power-ups and collectibles
- Weapon variety
- Day/night cycle
- Save/load progress
- Leaderboards
- Sound effects and music

---

**Ready to play?** Start the server and battle the bosses! 🎮

**Current Server**: http://localhost:8000
