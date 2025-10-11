/**
 * Notification Sound Utility
 * Plays sound when new notifications or messages arrive
 */

// Create audio element for notification sound
let notificationAudio = null;
let isAudioEnabled = true;

/**
 * Initialize notification sound
 * Uses a pleasant notification sound
 */
export function initNotificationSound() {
  if (notificationAudio) return;
  
  try {
    // Option 1: Use a pleasant notification sound from a CDN
    // This is a free notification sound - short, pleasant "ding" sound
    const soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
    
    // Option 2: Fallback to a simple beep if CDN fails
    // You can also place a custom sound file in /public/sounds/notification.mp3
    const fallbackUrl = '/sounds/notification.mp3';
    
    notificationAudio = new Audio(soundUrl);
    notificationAudio.volume = 0.5; // Set volume to 50%
    
    // Handle loading errors - fallback to local file
    notificationAudio.addEventListener('error', () => {
      console.warn('CDN sound failed, trying local fallback...');
      notificationAudio = new Audio(fallbackUrl);
      notificationAudio.volume = 0.5;
      notificationAudio.load();
    });
    
    // Preload the audio
    notificationAudio.load();
  } catch (error) {
    console.warn('Failed to initialize notification sound:', error);
  }
}

/**
 * Play notification sound
 * @param {string} type - Type of notification ('message', 'notification', 'request')
 */
export function playNotificationSound(type = 'notification') {
  if (!isAudioEnabled) return;
  
  try {
    // Initialize audio if not already done
    if (!notificationAudio) {
      initNotificationSound();
    }
    
    if (notificationAudio) {
      // Reset audio to start
      notificationAudio.currentTime = 0;
      
      // Adjust volume based on type
      switch (type) {
        case 'message':
          notificationAudio.volume = 0.6; // Slightly louder for messages
          break;
        case 'request':
          notificationAudio.volume = 0.7; // Even louder for requests
          break;
        default:
          notificationAudio.volume = 0.5; // Default volume
      }
      
      // Play sound (handle promise for browsers that require user interaction)
      const playPromise = notificationAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Auto-play was prevented - this is expected on first load
          console.debug('Notification sound auto-play prevented:', error.message);
        });
      }
    }
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Enable notification sound
 */
export function enableNotificationSound() {
  isAudioEnabled = true;
  localStorage.setItem('notificationSoundEnabled', 'true');
}

/**
 * Disable notification sound
 */
export function disableNotificationSound() {
  isAudioEnabled = false;
  localStorage.setItem('notificationSoundEnabled', 'false');
}

/**
 * Toggle notification sound
 */
export function toggleNotificationSound() {
  isAudioEnabled = !isAudioEnabled;
  localStorage.setItem('notificationSoundEnabled', isAudioEnabled ? 'true' : 'false');
  return isAudioEnabled;
}

/**
 * Check if notification sound is enabled
 */
export function isNotificationSoundEnabled() {
  return isAudioEnabled;
}

/**
 * Load sound preference from localStorage
 */
export function loadSoundPreference() {
  const saved = localStorage.getItem('notificationSoundEnabled');
  if (saved !== null) {
    isAudioEnabled = saved === 'true';
  }
  return isAudioEnabled;
}

// Initialize on module load
loadSoundPreference();

// Initialize audio on first user interaction (to bypass auto-play restrictions)
let isInitialized = false;
function initOnUserInteraction() {
  if (!isInitialized) {
    initNotificationSound();
    isInitialized = true;
    // Remove listeners after first interaction
    document.removeEventListener('click', initOnUserInteraction);
    document.removeEventListener('keydown', initOnUserInteraction);
  }
}

// Listen for first user interaction
if (typeof document !== 'undefined') {
  document.addEventListener('click', initOnUserInteraction, { once: true });
  document.addEventListener('keydown', initOnUserInteraction, { once: true });
}
