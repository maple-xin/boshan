(() => {
  const audio = document.getElementById('background-music');
  const button = document.getElementById('music-toggle');
  audio.volume = 0.45;
  function reflect() {
    const playing = !audio.paused;
    button.textContent = playing ? '♫ 音乐开' : '♫ 音乐关';
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    button.title = playing ? '点一下暂停音乐' : '点一下播放音乐';
  }
  function failed() {
    reflect();
    button.textContent = '♫ 点我重试';
    button.setAttribute('aria-label', '音乐未能播放，点击重试');
    button.title = '音乐未能播放，点击重试';
  }
  function play() {
    if (audio.error) audio.load();
    audio.play().catch(failed);
  }
  audio.addEventListener('play', reflect);
  audio.addEventListener('pause', reflect);
  audio.addEventListener('error', failed);
  button.addEventListener('click', () => audio.paused ? play() : audio.pause());
  document.getElementById('cover-start').addEventListener('click', play, { once: true });
  reflect();
})();
