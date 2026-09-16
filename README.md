# WP Audio Player

Plugin para WordPress que adiciona automaticamente um player de áudio (texto-para-voz / TTS) no início de cada post, permitindo que o visitante ouça a matéria em vez de lê-la.

## Problema que resolve

Melhora a acessibilidade e o engajamento de sites de conteúdo/notícia, oferecendo uma alternativa de "ouvir a matéria" sem depender de gravação de áudio manual — o texto do post é convertido em voz no navegador do próprio leitor (usando a Web Speech API).

## Funcionalidades

- Player injetado automaticamente no conteúdo de posts públicos (ignora admin, AJAX, REST, feeds, preview, embed e páginas AMP).
- Controle de play/pause, progresso, volume, tema claro/escuro e tamanho de fonte.
- CSS carregado com `preload` e JS com `defer` para não impactar a performance de carregamento da página.

## Instalação

1. Copie a pasta do plugin para `wp-content/plugins/`.
2. Ative o plugin em **Plugins** no admin do WordPress.
3. O player passa a aparecer automaticamente no topo do conteúdo de posts do tipo `post`.

## Requisitos

- WordPress 5.0+
- PHP 7.4+
- Navegador do visitante com suporte à Web Speech API (a maioria dos navegadores modernos)

## Licença

MIT — veja o arquivo [LICENSE](LICENSE).
