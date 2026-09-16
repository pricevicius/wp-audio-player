<?php
/**
* Plugin Name: WP Audio Player
* Description: Gera automaticamente um leitor de áudio (texto-para-voz) no início de cada post.
* Version: 1.0.0
* Author: Pricevicius
* Text Domain: wp-audio-player
* License: MIT
*/

if (!defined('ABSPATH')) exit;
if(WP_DEBUG === true){
    error_reporting(E_ALL);
    ini_set('display_errors',1);
}

/**
 * CSS wp-audio-player => preload + onload
 */
add_filter('style_loader_tag', function ($html, $handle, $href, $media) {
	if ($handle !== 'wp-audio-player') return $html;

	$media = $media ?: 'all';
	$href_esc  = esc_url($href);
	$media_esc = esc_attr($media);

	$preload  = "<link rel='preload' as='style' href='{$href_esc}' onload=\"this.onload=null;this.rel='stylesheet'\" />\n";
	$noscript = "<noscript><link rel='stylesheet' href='{$href_esc}' media='{$media_esc}' /></noscript>\n";

	return $preload . $noscript;
}, 999, 4);


/**
 * JS wp-audio-player => defer
 */
add_filter('script_loader_tag', function ($tag, $handle, $src) {
	if ($handle !== 'wp-audio-player') return $tag;

	if (strpos($tag, ' defer') === false) {
		$tag = str_replace('<script ', '<script defer ', $tag);
	}
	return $tag;
}, 10, 3);
require 'application/init.php';