// Voice Chat App for オールイン番長
// Configuration
const CONFIG = {
  // Use local proxy (server.js handles the API call)
  API_URL: '/api/chat',
  MODEL: 'anthropic/claude-sonnet-4-20250514'
};

class VoiceChatApp {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isRecording = false;
    this.isSpeaking = false;
    this.blinkInterval = null;
    this.conversationHistory = [];
    
    // DOM Elements
    this.micButton = document.getElementById('micButton');
    this.status = document.getElementById('status');
    this.messageBox = document.getElementById('messageBox');
    this.voiceSelect = document.getElementById('voiceSelect');
    this.mouth = document.getElementById('mouth');
    this.eyeLeft = document.getElementById('eyeLeft');
    this.eyeRight = document.getElementById('eyeRight');
    
    this.init();
  }
  
  init() {
    console.log('🎰 Voice Chat App initializing...');
    
    // Check HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ HTTPS required for microphone access');
      this.status.textContent = 'HTTPSが必要です';
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
    
    // Start blinking animation
    this.startBlinking();
    console.log('✅ App initialized');
  }
  
  async toggleRecording() {
    if (this.isRecording) {
      console.log('⏹️ Stopping recording');
      this.recognition.stop();
    } else {
      // Check microphone permission first
      try {
        console.log('🔐 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Release immediately
        console.log('✅ Microphone permission granted');
        
        console.log('▶️ Starting recording');
        this.recognition.start();
      } catch (err) {
        console.error('❌ Microphone permission denied:', err);
        this.status.textContent = 'マイクの許可が必要です';
        this.status.className = 'status-indicator';
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
    
    // Show interim results
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
      'network': 'ネットワークエラー',
      'aborted': '中断されました',
      'service-not-allowed': 'サービスが許可されていません'
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
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: message });
    
    try {
      // Call local proxy
      console.log('🌐 Fetching:', CONFIG.API_URL);
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: this.conversationHistory.slice(-10), // Keep last 10 messages
          stream: false
        })
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📥 Response data:', data);
      const reply = data.choices?.[0]?.message?.content || 'ごめん、うまく返答できなかった...';
      
      // Add to history
      this.conversationHistory.push({ role: 'assistant', content: reply });
      
      this.addMessage(reply, 'assistant');
      this.speak(reply);
      
    } catch (error) {
      console.error('❌ API Error:', error);
      const fallbackReply = 'ごめんね、接続エラーが起きたみたい。もう一度試してね！';
      this.addMessage(fallbackReply, 'assistant');
      this.speak(fallbackReply);
    }
  }
  
  speak(text) {
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const voiceType = this.voiceSelect.value;
    
    if (voiceType === 'zundamon') {
      // Try VOICEVOX for Zundamon (if available)
      this.speakWithVoicevox(text);
    } else {
      this.speakWithWebSpeech(text);
    }
  }
  
  speakWithWebSpeech(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.1;
    utterance.pitch = 1.2;
    
    // Find Japanese voice
    const voices = this.synthesis.getVoices();
    const japaneseVoice = voices.find(v => v.lang.includes('ja'));
    if (japaneseVoice) {
      utterance.voice = japaneseVoice;
    }
    
    utterance.onstart = () => this.onSpeakStart();
    utterance.onend = () => this.onSpeakEnd();
    
    this.synthesis.speak(utterance);
  }
  
  async speakWithVoicevox(text) {
    try {
      // VOICEVOX API (ずんだもん = speaker 3, 早口)
      const queryRes = await fetch(`http://localhost:50021/audio_query?text=${encodeURIComponent(text)}&speaker=3`, {
        method: 'POST'
      });
      
      if (!queryRes.ok) throw new Error('VOICEVOX query failed');
      
      const query = await queryRes.json();
      query.speedScale = 1.5; // 早口
      
      const audioRes = await fetch('http://localhost:50021/synthesis?speaker=3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      
      if (!audioRes.ok) throw new Error('VOICEVOX synthesis failed');
      
      const audioBlob = await audioRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => this.onSpeakStart();
      audio.onended = () => {
        this.onSpeakEnd();
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      
    } catch (error) {
      console.warn('VOICEVOX unavailable, falling back to Web Speech:', error);
      this.speakWithWebSpeech(text);
    }
  }
  
  onSpeakStart() {
    this.isSpeaking = true;
    this.status.textContent = '話しています...';
    this.status.className = 'status-indicator speaking';
    this.mouth.classList.add('talking');
  }
  
  onSpeakEnd() {
    this.isSpeaking = false;
    this.status.textContent = '待機中...';
    this.status.className = 'status-indicator';
    this.mouth.classList.remove('talking');
  }
  
  startBlinking() {
    // Random blinking every 2-5 seconds
    const blink = () => {
      this.eyeLeft.classList.add('blinking');
      this.eyeRight.classList.add('blinking');
      
      setTimeout(() => {
        this.eyeLeft.classList.remove('blinking');
        this.eyeRight.classList.remove('blinking');
      }, 150);
      
      // Schedule next blink
      const nextBlink = 2000 + Math.random() * 3000;
      setTimeout(blink, nextBlink);
    };
    
    // Start first blink after 1 second
    setTimeout(blink, 1000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for voices to load
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      new VoiceChatApp();
    };
  } else {
    new VoiceChatApp();
  }
});
