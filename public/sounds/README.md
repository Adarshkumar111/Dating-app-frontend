# Notification Sounds

## Current Sound
The app uses a pleasant notification sound from Mixkit (free CDN):
- **Sound**: Short "ding" notification tone
- **Duration**: ~0.5 seconds
- **Type**: Pleasant, non-intrusive chime
- **Source**: https://mixkit.co/free-sound-effects/notification/

## Sound Details by Type

### 1. **Messages** 🔊
- Volume: 60%
- Sound: Pleasant ding
- When: New message arrives in chat

### 2. **Notifications** 🔔
- Volume: 50%
- Sound: Pleasant ding
- When: 
  - Profile approved/rejected
  - Premium activated
  - Help request response

### 3. **Requests** 📢
- Volume: 70% (slightly louder for admin)
- Sound: Pleasant ding
- When:
  - Admin: New pending edit
  - Admin: New request
  - Admin: Premium purchase

## How to Customize Sound

### Option 1: Use Your Own Sound File

1. Download or create your notification sound (MP3 or WAV format)
2. Name it `notification.mp3`
3. Place it in this directory: `client/public/sounds/notification.mp3`
4. The app will automatically use your custom sound

### Option 2: Use a Different CDN Sound

1. Find a free notification sound (e.g., from Mixkit, Freesound, or Zapsplat)
2. Get the direct MP3 URL
3. Edit `client/src/utils/notificationSound.js`
4. Replace the `soundUrl` with your new URL:
   ```javascript
   const soundUrl = 'YOUR_SOUND_URL_HERE';
   ```

## Recommended Sound Characteristics

- **Duration**: 0.3 - 1 second (short and sweet)
- **Volume**: Not too loud or startling
- **Format**: MP3 or WAV
- **Size**: < 50KB (for fast loading)
- **Type**: Positive, pleasant tone (avoid harsh beeps)

## Free Sound Resources

1. **Mixkit** - https://mixkit.co/free-sound-effects/notification/
2. **Freesound** - https://freesound.org/ (requires attribution)
3. **Zapsplat** - https://www.zapsplat.com/sound-effect-categories/
4. **Notification Sounds** - https://notificationsounds.com/

## Disable Sound

Users can disable the notification sound by:
1. Using the toggle in settings (if implemented)
2. Or programmatically:
   ```javascript
   import { disableNotificationSound } from './utils/notificationSound';
   disableNotificationSound();
   ```

The preference is saved in browser localStorage and persists across sessions.
