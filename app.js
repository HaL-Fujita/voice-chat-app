// Voice Chat App for オールイン番長
const CONFIG = {
  API_URL: '/api/chat',
  MODEL: 'anthropic/claude-sonnet-4-20250514'
};

class AvatarAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = 200;
    this.canvas.height = 200;
    
    this.isTalking = false;
    this.mouthPhase = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.blinkPhase = 0;
    
    this.animate();
  }
  
  animate() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 10;
    
    ctx.clearRect(0, 0, w, h);
    
    // 髪の毛（後ろ）
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 85, 90, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    
    // 顔（円）
    ctx.fillStyle = '#ffe4c9';
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();
    
    // 髪の毛（前髪）
    ctx.fillStyle = '#4a3728';
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy - 30);
    ctx.quadraticCurveTo(cx - 50, cy - 70, cx - 20, cy - 55);
    ctx.quadraticCurveTo(cx, cy - 75, cx + 20, cy - 55);
    ctx.quadraticCurveTo(cx + 50, cy - 70, cx + 70, cy - 30);
    ctx.quadraticCurveTo(cx + 75, cy - 60, cx + 60, cy - 85);
    ctx.quadraticCurveTo(cx, cy - 100, cx - 60, cy - 85);
    ctx.quadraticCurveTo(cx - 75, cy - 60, cx - 70, cy - 30);
    ctx.fill();
    
    // サイドの髪
    ctx.beginPath();
    ctx.ellipse(cx - 75, cy + 10, 15, 50, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 75, cy + 10, 15, 50, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // まばたき処理
    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer > 100 + Math.random() * 80) {
      this.isBlinking = true;
      this.blinkPhase = 0;
      this.blinkTimer = 0;
    }
    
    let eyeOpen = 1;
    if (this.isBlinking) {
      this.blinkPhase++;
      if (this.blinkPhase <= 4) {
        eyeOpen = 1 - (this.blinkPhase / 4);
      } else if (this.blinkPhase <= 8) {
        eyeOpen = (this.blinkPhase - 4) / 4;
      } else {
        this.isBlinking = false;
        eyeOpen = 1;
      }
    }
    
    // 左目（大きくかわいく）
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 22, cy - 5, 18, 22 * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 左目の瞳
    if (eyeOpen > 0.3) {
      // 瞳（大きめ）
      ctx.fillStyle = '#3d2314';
      ctx.beginPath();
      ctx.arc(cx - 22, cy - 3, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // 瞳の中心
      ctx.fillStyle = '#1a0f0a';
      ctx.beginPath();
      ctx.arc(cx - 22, cy - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // ハイライト（大）
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 17, cy - 9, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // ハイライト（小）
      ctx.beginPath();
      ctx.arc(cx - 26, cy + 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 右目（大きくかわいく）
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx + 22, cy - 5, 18, 22 * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 右目の瞳
    if (eyeOpen > 0.3) {
      ctx.fillStyle = '#3d2314';
      ctx.beginPath();
      ctx.arc(cx + 22, cy - 3, 12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#1a0f0a';
      ctx.beginPath();
      ctx.arc(cx + 22, cy - 2, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx + 27, cy - 9, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(cx + 18, cy + 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 眉毛（やわらかく）
    ctx.strokeStyle = '#4a3728';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(cx - 38, cy - 30);
    ctx.quadraticCurveTo(cx - 22, cy - 35, cx - 8, cy - 30);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 30);
    ctx.quadraticCurveTo(cx + 22, cy - 35, cx + 38, cy - 30);
    ctx.stroke();
    
    // 鼻（小さく）
    ctx.fillStyle = '#f0c9b0';
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // ほっぺ（ピンク）
    ctx.fillStyle = 'rgba(255, 130, 130, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - 45, cy + 15, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 45, cy + 15, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 口
    let mouthOpen = 0;
    if (this.isTalking) {
      this.mouthPhase += 0.3;
      mouthOpen = Math.abs(Math.sin(this.mouthPhase));
    }
    
    if (mouthOpen > 0.2) {
      // 開いた口
      ctx.fillStyle = '#d35';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 32, 12, 6 + mouthOpen * 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 口の中
      ctx.fillStyle = '#611';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 34, 8, mouthOpen * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // にっこり口（∪型）
      ctx.strokeStyle = '#d35';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy + 25, 15, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
    
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
    this.conversationHistory = [];
    this.animator = null;
    
    this.micButton = document.getElementById('micButton');
    this.status = document.getElementById('status');
    this.messageBox = document.getElementById('messageBox');
    this.textInput = document.getElementById('textInput');
    this.sendButton = document.getElementById('sendButton');
    this.avatarCanvas = document.getElementById('avatarCanvas');
    
    this.init();
  }
  
  init() {
    console.log('🎰 Initializing...');
    
    if (this.avatarCanvas) {
      this.animator = new AvatarAnimator(this.avatarCanvas);
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
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
      this.status.textContent = '音声認識非対応';
      this.micButton.disabled = true;
    }
    
    this.micButton.addEventListener('click', () => this.toggleRecording());
    this.sendButton.addEventListener('click', () => this.sendTextMessage());
    this.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendTextMessage();
    });
    
    console.log('✅ Ready');
  }
  
  sendTextMessage() {
    const text = this.textInput.value.trim();
    if (text) {
      this.addMessage(text, 'user');
      this.status.textContent = '💭 考え中...';
      this.sendToAPI(text);
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
        this.status.textContent = 'マイクの許可が必要です';
        alert('マイクの使用を許可してください');
      }
    }
  }
  
  onRecordingStart() {
    this.isRecording = true;
    this.micButton.classList.add('recording');
    this.status.textContent = '🎤 聞いています...';
  }
  
  onRecordingResult(event) {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (event.results[event.results.length - 1].isFinal) {
      this.addMessage(transcript, 'user');
      this.status.textContent = '💭 考え中...';
      this.sendToAPI(transcript);
    }
  }
  
  onRecordingEnd() {
    this.isRecording = false;
    this.micButton.classList.remove('recording');
    this.status.textContent = '待機中';
  }
  
  onRecordingError(event) {
    this.status.textContent = 'エラー: ' + event.error;
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
  
  async sendToAPI(message) {
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
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      let reply = data.choices?.[0]?.message?.content || '...';
      
      // MEDIA: 行を除去
      reply = reply.split('\n').filter(line => !line.startsWith('MEDIA:')).join('\n').trim();
      
      if (!reply) reply = '...';
      
      this.conversationHistory.push({ role: 'assistant', content: reply });
      this.addMessage(reply, 'assistant');
      this.speak(reply);
      
    } catch (error) {
      this.status.textContent = 'エラー';
      this.addMessage('接続エラー', 'assistant');
    }
  }
  
  speak(text) {
    this.synthesis.cancel();
    
    // アスタリスクと絵文字を除去
    let cleanText = text
      .replace(/\*+/g, '')  // アスタリスク
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]/gu, '')  // 絵文字
      .replace(/\s+/g, ' ')  // 余分なスペース
      .trim();
    
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.5;   // 1.5倍速
    utterance.pitch = 1.4;  // 高めのピッチ（かわいい声）
    
    const voices = this.synthesis.getVoices();
    const japaneseVoice = voices.find(v => v.lang.includes('ja'));
    if (japaneseVoice) utterance.voice = japaneseVoice;
    
    utterance.onstart = () => {
      this.status.textContent = '🗣️ 話しています...';
      if (this.animator) this.animator.startTalking();
    };
    
    utterance.onend = () => {
      this.status.textContent = '待機中';
      if (this.animator) this.animator.stopTalking();
    };
    
    this.synthesis.speak(utterance);
  }
}

document.addEventListener('DOMContentLoaded', () => new VoiceChatApp());
