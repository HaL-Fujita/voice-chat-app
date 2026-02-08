// Voice Chat App for オールイン番長
// Configuration
const CONFIG = {
  API_URL: '/api/chat',
  MODEL: 'anthropic/claude-sonnet-4-20250514'
};

class AvatarAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.image = new Image();
    this.loaded = false;
    this.isTalking = false;
    this.mouthPhase = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.blinkPhase = 0;
    
    this.image.onload = () => {
      this.loaded = true;
      this.canvas.width = 300;
      this.canvas.height = 300;
      this.animate();
    };
    this.image.src = 'avatar.jpg';
  }
  
  animate() {
    if (!this.loaded) return;
    
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // 画像を描画
    ctx.clearRect(0, 0, w, h);
    
    // 円形クリップ
    ctx.save();
    ctx.beginPath();
    ctx.arc(w/2, h/2, w/2 - 5, 0, Math.PI * 2);
    ctx.clip();
    
    // アバター画像
    ctx.drawImage(this.image, 0, 0, w, h);
    
    // まばたき処理
    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer > 90 + Math.random() * 60) {
      this.isBlinking = true;
      this.blinkPhase = 0;
      this.blinkTimer = 0;
    }
    
    if (this.isBlinking) {
      this.blinkPhase++;
      const blinkProgress = this.blinkPhase <= 5 
        ? this.blinkPhase / 5 
        : (10 - this.blinkPhase) / 5;
      
      if (this.blinkPhase >= 10) {
        this.isBlinking = false;
      }
      
      // まぶたを描画（肌色）
      ctx.fillStyle = '#e8c4a0';
      
      // 左目
      ctx.beginPath();
      ctx.ellipse(w * 0.35, h * 0.42, w * 0.08, h * 0.05 * blinkProgress, 0, 0, Math.PI);
      ctx.fill();
      
      // 右目
      ctx.beginPath();
      ctx.ellipse(w * 0.65, h * 0.42, w * 0.08, h * 0.05 * blinkProgress, 0, 0, Math.PI);
      ctx.fill();
    }
    
    // 話し中の口パク
    if (this.isTalking) {
      this.mouthPhase += 0.3;
      const mouthOpen = (Math.sin(this.mouthPhase) + 1) / 2;
      
      ctx.fillStyle = '#3a2a2a';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.72, w * 0.1, h * 0.03 + h * 0.04 * mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    
    // 枠線
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w/2, h/2, w/2 - 5, 0, Math.PI * 2);
    ctx.stroke();
    
    requestAnimationFrame(() => this.animate());
  }
  
  startTalking() {
    this.isTalking = true;
    this.mouthPhase = 0;
  }
  
  stopTalking() {
    this.isTalking = false;
  }
}

class VoiceChatApp {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isRecording = false;
    this.isSpeaking = false;
    this.conversationHistory = [];
    this.animator = null;
    
    // DOM Elements
    this.micButton = document.getElementById('micButton');
    this.status = document.getElementById('status');
    this.messageBox = document.getElementById('messageBox');
    this.voiceSelect = document.getElementById('voiceSelect');
    this.textInput = document.getElementById('textInput');
    this.sendButton = document.getElementById('sendButton');
    this.avatarCanvas = document.getElementById('avatarCanvas');
    
    this.init();
  }
  
  init() {
    console.log('🎰 Voice Chat App initializing...');
    
    // Initialize avatar animator
    if (this.avatarCanvas) {
      this.animator = new AvatarAnimator(this.avatarCanvas);
      console.log('✅ Avatar animator initialized');
    }
    
    // Check HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ HTTPS required for microphone access');
    }
    
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('✅ Speech Recognition supported');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'ja-JP';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      
      this.recognition.onstart = () => this.onRecordingStart();
      this.recognition.onresult = (e) => this.onRecordingResult(e);
      this.recognition.onend = () => this.onRecordingEnd();
      this.recognition.onerror = (e) => this.onRecordingError(e);
    } else {
      console.error('❌ Speech Recognition not supported');
      this.status.textContent = '音声認識非対応のブラウザです';
      this.micButton.disabled = true;
    }
    
    // Event Listeners
    this.micButton.addEventListener('click', () => {
      console.log('🎤 Mic button clicked');
      this.toggleRecording();
    });
    
    // Text input listeners
    this.sendButton.addEventListener('click', () => this.sendTextMessage());
    this.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendTextMessage();
      }
    });
    
    console.log('✅ App initialized');
  }
  
  sendTextMessage() {
    const text = this.textInput.value.trim();
    console.log('📝 Send button clicked, text:', text);
    if (text) {
      this.addMessage(text, 'user');
      this.sendToOpenClaw(text);
      this.textInput.value = '';
    }
  }
  
  async toggleRecording() {
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        this.recognition.start();
      } catch (err) {
        console.error('❌ Microphone permission denied:', err);
        this.status.textContent = 'マイクの許可が必要です';
        alert('マイクの使用を許可してください');
      }
    }
  }
  
  onRecordingStart() {
    this.isRecording = true;
    this.micButton.classList.add('recording');
    this.status.textContent = '聞いています...';
    this.status.className = 'status-indicator listening';
  }
  
  onRecordingResult(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    
    if (event.results[event.results.length - 1].isFinal) {
      this.addMessage(transcript, 'user');
      this.sendToOpenClaw(transcript);
    }
  }
  
  onRecordingEnd() {
    this.isRecording = false;
    this.micButton.classList.remove('recording');
    this.status.textContent = '待機中...';
    this.status.className = 'status-indicator';
  }
  
  onRecordingError(event) {
    console.error('❌ Speech recognition error:', event.error);
    const errorMessages = {
      'no-speech': '音声が検出されませんでした',
      'audio-capture': 'マイクが見つかりません',
      'not-allowed': 'マイクの許可が必要です',
      'network': 'ネットワークエラー'
    };
    this.status.textContent = errorMessages[event.error] || `エラー: ${event.error}`;
    this.status.className = 'status-indicator';
    this.isRecording = false;
    this.micButton.classList.remove('recording');
  }
  
  addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.textContent = text;
    this.messageBox.appendChild(div);
    this.messageBox.scrollTop = this.messageBox.scrollHeight;
  }
  
  async sendToOpenClaw(message) {
    console.log('📤 Sending to API:', message);
    this.status.textContent = '考え中...';
    this.status.className = 'status-indicator thinking';
    
    this.conversationHistory.push({ role: 'user', content: message });
    
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: this.conversationHistory.slice(-10),
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'ごめん、うまく返答できなかった...';
      
      this.conversationHistory.push({ role: 'assistant', content: reply });
      this.addMessage(reply, 'assistant');
      this.speak(reply);
      
    } catch (error) {
      console.error('❌ API Error:', error);
      this.status.textContent = 'エラー発生';
      this.addMessage(`接続エラー: ${error.message}`, 'assistant');
    }
  }
  
  speak(text) {
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    
    const voices = this.synthesis.getVoices();
    const japaneseVoice = voices.find(v => v.lang.includes('ja'));
    if (japaneseVoice) utterance.voice = japaneseVoice;
    
    utterance.onstart = () => {
      this.status.textContent = '話しています...';
      this.status.className = 'status-indicator speaking';
      if (this.animator) this.animator.startTalking();
    };
    
    utterance.onend = () => {
      this.status.textContent = '待機中...';
      this.status.className = 'status-indicator';
      if (this.animator) this.animator.stopTalking();
    };
    
    this.synthesis.speak(utterance);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎰 DOM loaded, initializing app...');
  new VoiceChatApp();
});
