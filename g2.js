  // Game state
    let randomNumber = Math.floor(Math.random() * 100) + 1;
    let attempts = 0;
    let gameOver = false;
    let guessHistory = [];
    let bestScore = null;
    let lowBound = 1;
    let highBound = 100;

    const defaultConfig = {
      game_title: 'Guess the Number',
      subtitle_text: "I'm thinking of a number between 1 and 100",
      background_color: '#0a0a1a',
      surface_color: '#1e1e3c',
      text_color: '#f0f0ff',
      primary_action_color: '#6366f1',
      secondary_action_color: '#8b5cf6',
      font_family: 'Outfit',
      font_size: 16
    };

    function applyConfig(config) {
      const c = { ...defaultConfig, ...config };
      const app = document.getElementById('app');
      const title = document.getElementById('game-title');
      const subtitle = document.getElementById('subtitle-text');
      const input = document.getElementById('guessInput');
      const attemptsCount = document.getElementById('attempts-count');
      const guessBtn = document.getElementById('guess-btn');
      const card = document.getElementById('game-card');
      const headerIcon = document.getElementById('header-icon');
      const progressCircle = document.getElementById('progress-circle');
      const baseSize = c.font_size || 16;
      const font = c.font_family || 'Outfit';
      const fontStack = `${font}, sans-serif`;

      app.style.background = c.background_color;
      app.style.fontFamily = fontStack;

      card.style.background = `linear-gradient(145deg, ${c.surface_color}f2, ${adjustBrightness(c.surface_color, -20)}fa)`;
      card.style.borderColor = `${c.text_color}14`;

      title.textContent = c.game_title;
      title.style.color = c.text_color;
      title.style.fontFamily = fontStack;
      title.style.fontSize = `${baseSize * 1.5}px`;

      subtitle.textContent = c.subtitle_text;
      subtitle.style.color = `${c.text_color}80`;
      subtitle.style.fontSize = `${baseSize * 0.85}px`;
      subtitle.style.fontFamily = fontStack;

      input.style.borderColor = `${c.text_color}1a`;
      input.style.color = c.text_color;
      input.style.fontSize = `${baseSize * 1.2}px`;

      attemptsCount.style.color = c.text_color;
      attemptsCount.style.fontSize = `${baseSize * 1.5}px`;

      guessBtn.style.background = `linear-gradient(135deg, ${c.primary_action_color}, ${c.secondary_action_color})`;
      guessBtn.style.boxShadow = `0 4px 20px ${c.primary_action_color}59`;
      guessBtn.style.fontSize = `${baseSize}px`;

      headerIcon.style.background = `linear-gradient(135deg, ${c.primary_action_color}, ${c.secondary_action_color})`;
      headerIcon.style.boxShadow = `0 8px 30px ${c.primary_action_color}66`;

      progressCircle.style.stroke = c.primary_action_color;

      document.querySelectorAll('#guess-history .history-item').forEach(el => {
        if (el.dataset.direction === 'correct') {
          el.style.background = `${c.primary_action_color}33`;
          el.style.borderColor = `${c.primary_action_color}66`;
        }
      });
    }

    function adjustBrightness(hex, amount) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const num = parseInt(hex, 16);
      let r = Math.min(255, Math.max(0, (num >> 16) + amount));
      let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
      let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
      return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    }

    // Element SDK
    window.elementSdk.init({
      defaultConfig,
      onConfigChange: async (config) => { applyConfig(config); },
      mapToCapabilities: (config) => ({
        recolorables: [
          { get: () => config.background_color || defaultConfig.background_color, set: (v) => { config.background_color = v; window.elementSdk.setConfig({ background_color: v }); } },
          { get: () => config.surface_color || defaultConfig.surface_color, set: (v) => { config.surface_color = v; window.elementSdk.setConfig({ surface_color: v }); } },
          { get: () => config.text_color || defaultConfig.text_color, set: (v) => { config.text_color = v; window.elementSdk.setConfig({ text_color: v }); } },
          { get: () => config.primary_action_color || defaultConfig.primary_action_color, set: (v) => { config.primary_action_color = v; window.elementSdk.setConfig({ primary_action_color: v }); } },
          { get: () => config.secondary_action_color || defaultConfig.secondary_action_color, set: (v) => { config.secondary_action_color = v; window.elementSdk.setConfig({ secondary_action_color: v }); } }
        ],
        borderables: [],
        fontEditable: {
          get: () => config.font_family || defaultConfig.font_family,
          set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); }
        },
        fontSizeable: {
          get: () => config.font_size || defaultConfig.font_size,
          set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); }
        }
      }),
      mapToEditPanelValues: (config) => new Map([
        ['game_title', config.game_title || defaultConfig.game_title],
        ['subtitle_text', config.subtitle_text || defaultConfig.subtitle_text]
      ])
    });

    // Game logic
    function checkGuess() {
      if (gameOver) return;

      const input = document.getElementById('guessInput');
      const userGuess = parseInt(input.value);
      const message = document.getElementById('message');
      const messageArea = document.getElementById('message-area');

      if (isNaN(userGuess) || userGuess < 1 || userGuess > 100) {
        message.textContent = '⚠️ Pick a number between 1 and 100';
        message.style.color = '#fbbf24';
        messageArea.classList.add('animate-shake');
        setTimeout(() => messageArea.classList.remove('animate-shake'), 500);
        return;
      }

      attempts++;
      guessHistory.push({ value: userGuess, direction: userGuess === randomNumber ? 'correct' : userGuess > randomNumber ? 'high' : 'low' });

      updateAttempts();
      updateHistory();
      updateHintBar(userGuess);

      if (userGuess === randomNumber) {
        winGame();
      } else if (userGuess > randomNumber) {
        highBound = Math.min(highBound, userGuess - 1);
        message.innerHTML = `<span style="font-size: 20px;">📉</span> Too high! Try lower`;
        message.style.color = '#f87171';
        messageArea.classList.add('animate-shake');
        setTimeout(() => messageArea.classList.remove('animate-shake'), 500);
      } else {
        lowBound = Math.max(lowBound, userGuess + 1);
        message.innerHTML = `<span style="font-size: 20px;">📈</span> Too low! Try higher`;
        message.style.color = '#fb923c';
        messageArea.classList.add('animate-shake');
        setTimeout(() => messageArea.classList.remove('animate-shake'), 500);
      }

      input.value = '';
      input.focus();
    }

    function winGame() {
      gameOver = true;
      const message = document.getElementById('message');
      const winStats = document.getElementById('win-stats');
      const winMessage = document.getElementById('win-message');
      const card = document.getElementById('game-card');

      message.innerHTML = `<span style="font-size: 22px;">✨</span> The number was <strong>${randomNumber}</strong>!`;
      message.style.color = '#34d399';

      card.classList.add('animate-celebrate');
      setTimeout(() => card.classList.remove('animate-celebrate'), 800);

      let rating = '';
      if (attempts <= 3) rating = '🏆 Legendary — you\'re a mind reader!';
      else if (attempts <= 5) rating = '⭐ Excellent — impressive deduction!';
      else if (attempts <= 7) rating = '👏 Great job — well played!';
      else if (attempts <= 10) rating = '👍 Not bad — room to improve!';
      else rating = '🎲 Got it! Try fewer guesses next time.';

      winMessage.textContent = `${attempts} ${attempts === 1 ? 'attempt' : 'attempts'} — ${rating}`;
      winStats.classList.remove('hidden');
      winStats.classList.add('animate-slide-up');

      if (!bestScore || attempts < bestScore) {
        bestScore = attempts;
        document.getElementById('best-score').textContent = `🏅 Best: ${bestScore} ${bestScore === 1 ? 'attempt' : 'attempts'}`;
      }

      launchConfetti();
    }

    function updateAttempts() {
      const el = document.getElementById('attempts-count');
      el.textContent = attempts;

      const maxAttempts = 10;
      const progress = Math.min(attempts / maxAttempts, 1);
      const circumference = 264;
      const offset = circumference - (progress * circumference);
      document.getElementById('progress-circle').style.strokeDashoffset = offset;
    }

    function updateHistory() {
      const section = document.getElementById('history-section');
      const container = document.getElementById('guess-history');
      section.classList.remove('hidden');

      const lastGuess = guessHistory[guessHistory.length - 1];
      const chip = document.createElement('div');
      chip.className = 'history-item inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold';
      chip.dataset.direction = lastGuess.direction;

      const colors = {
        high: 'background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); color: #f87171;',
        low: 'background: rgba(251,146,60,0.15); border: 1px solid rgba(251,146,60,0.3); color: #fb923c;',
        correct: 'background: rgba(52,211,153,0.2); border: 1px solid rgba(52,211,153,0.4); color: #34d399;'
      };

      const arrows = { high: '↓', low: '↑', correct: '✓' };
      chip.style.cssText = colors[lastGuess.direction];
      chip.style.fontFamily = "'JetBrains Mono', monospace";
      chip.textContent = `${lastGuess.value} ${arrows[lastGuess.direction]}`;
      container.appendChild(chip);
      container.scrollTop = container.scrollHeight;
    }

    function updateHintBar(guess) {
      const bar = document.getElementById('hint-bar');
      const indicator = document.getElementById('hint-indicator');
      bar.classList.remove('hidden');

      const pct = ((guess - 1) / 99) * 100;
      indicator.style.left = `${pct}%`;
      indicator.style.width = '6px';

      if (guess === randomNumber) {
        indicator.style.background = 'linear-gradient(90deg, #34d399, #22d3ee)';
        indicator.style.width = '10px';
      } else if (guess > randomNumber) {
        indicator.style.background = 'linear-gradient(90deg, #f87171, #ef4444)';
      } else {
        indicator.style.background = 'linear-gradient(90deg, #fb923c, #f97316)';
      }
    }

    function launchConfetti() {
      const container = document.getElementById('confetti-container');
      const colors = ['#6366f1', '#8b5cf6', '#34d399', '#22d3ee', '#f472b6', '#fbbf24'];

      for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.width = `${6 + Math.random() * 8}px`;
        piece.style.height = `${6 + Math.random() * 8}px`;
        piece.style.animationDelay = `${Math.random() * 1.2}s`;
        piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
        container.appendChild(piece);
      }

      setTimeout(() => { container.innerHTML = ''; }, 4000);
    }

    function restartGame() {
      randomNumber = Math.floor(Math.random() * 100) + 1;
      attempts = 0;
      gameOver = false;
      guessHistory = [];
      lowBound = 1;
      highBound = 100;

      document.getElementById('message').textContent = 'Take your best shot!';
      document.getElementById('message').style.color = 'rgba(200,200,255,0.5)';
      document.getElementById('attempts-count').textContent = '0';
      document.getElementById('progress-circle').style.strokeDashoffset = 264;
      document.getElementById('guessInput').value = '';
      document.getElementById('guess-history').innerHTML = '';
      document.getElementById('history-section').classList.add('hidden');
      document.getElementById('hint-bar').classList.add('hidden');
      document.getElementById('win-stats').classList.add('hidden');
      document.getElementById('guessInput').focus();
    }

    // Enter key support
    document.getElementById('guessInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); checkGuess(); }
    });

    lucide.createIcons();