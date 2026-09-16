<?php

function wp_audio_player_render($content)
{
	// ✅ Só front-end “normal”
	if (is_admin()) return $content;
	if (wp_doing_ajax()) return $content;
	if (defined('REST_REQUEST') && REST_REQUEST) return $content;
	if (is_feed()) return $content;
	if (is_preview()) return $content;
	if (is_embed()) return $content;

	// ✅ Ignora AMP
	if (
		(function_exists('is_amp_endpoint') && is_amp_endpoint()) || // AMP plugin
		isset($_GET['amp']) ||                                       // ?amp
		strpos($_SERVER['REQUEST_URI'], '/amp') !== false ||        // /amp/
		strpos($_SERVER['REQUEST_URI'], '/amp/') !== false           // /amp/
	) {
		return $content;
	}

	// ✅ (opcional) evita rodar fora do loop principal / em conteúdos secundários
	if (!in_the_loop() || !is_main_query()) return $content;
	$post_id = get_the_ID();
	if (get_post_type($post_id) != 'post') {
		return $content;
	}
	wp_enqueue_style('wp-audio-player', plugin_dir_url(__DIR__) . 'application/assets/css/audio.css', array(), rand(), "screen");
	wp_enqueue_script('wp-audio-player', plugin_dir_url(__DIR__) . 'application/assets/js/audio-player.js', array(), rand(), true);

	$content_audio = '<div class="wp-audio-player play-audio" data-tts data-tts-source="#dsoaudio" data-tts-voice="pt-BR" data-tts-wpm="160">
				<div class="player">
					<button class="play-btn" id="playBtn">
						<svg id="playIcon" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
					</button>
					<div class="progress" id="progress">
						<div class="progress-fill" id="progressFill"></div>
					</div>
					<div id="timeLabel">00:00</div>
					<div class="volume">
						<svg class="volume-icon" id="volumeIcon" viewBox="0 0 24 24" width="20" height="20">
							<path class="volume-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
							<path class="volume-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" style="display: none;"/>
						</svg>
						<input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="1">
					</div>

					<!-- CONTROLES -->
					<div class="controls">
						<span class="icon-sun">
							<img src="'.plugin_dir_url(__DIR__).'application/assets/img/iconSun.svg" alt="Modo claro" width="24" height="24">
						</span>

						<div class="toggle" id="themeToggle">
							<div class="toggle-circle"></div>
						</div>

						<span class="icon-moon">
							<img src="'.plugin_dir_url(__DIR__).'application/assets/img/iconMoon.svg" alt="Modo escuro" width="24" height="24">
						</span>

						<div class="font-controls">
							<span id="fontPlus">A+</span>
							<span id="fontMinus">A-</span>
						</div>
					</div>
				</div>
			</div>';

	return $content_audio . $content;
}
add_filter('the_content', 'wp_audio_player_render', 30, 1);
