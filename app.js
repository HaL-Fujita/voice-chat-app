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
    const cy = h / 2;
    
    ctx.clearRect(0, 0, w, h);
    
    // 顔（円）
    ctx.fillStyle = '#ffecd2';
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // 顔の輪郭
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 3;
    ctx.stroke();
    
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
    
    // 左目
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 25, cy - 10, 15, 20 * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 左目の瞳
    if (eyeOpen > 0.3) {
      ctx.fillStyle = '#2c1810';
      ctx.beginPath();
      ctx.arc(cx - 25, cy - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // ハイライト
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 22, cy - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 右目
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx + 25, cy - 10, 15, 20 * eyeOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 右目の瞳
    if (eyeOpen > 0.3) {
      ctx.fillStyle = '#2c1810';
      ctx.beginPath();
      ctx.arc(cx + 25, cy - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // ハイライト
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx + 28, cy - 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 眉毛
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 35);
    ctx.quadraticCurveTo(cx - 25, cy - 42, cx - 10, cy - 35);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 35);
    ctx.quadraticCurveTo(cx + 25, cy - 42, cx + 40, cy - 35);
    ctx.stroke();
    
    // 鼻
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 5);
    ctx.lineTo(cx - 5, cy + 15);
    ctx.lineTo(cx + 5, cy + 15);
    ctx.stroke();
    
    // 口
    let mouthHeight = 5;
    if (this.isTalking) {
      this.mouthPhase += 0.25;
      mouthHeight = 5 + Math.abs(Math.sin(this.mouthPhase)) * 15;
    }
    
    ctx.fillStyle = '#c44';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 40, 20, mouthHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 口の中（話し中）
    if (mouthHeight > 8) {
      ctx.fillStyle = '#611';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 42, 12, mouthHeight - 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // ほっぺ
    ctx.fillStyle = 'rgba(255, 150, 150, 0.3)';
    ctx.beginPath();
    ctx.ellipse(cx - 55, cy + 15, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 55, cy + 15, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
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
    this.status.textContent = '💭 考え中...';
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
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
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
