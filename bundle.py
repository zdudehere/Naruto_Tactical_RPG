#!/usr/bin/env python3
"""Bundle all game files into a single self-contained HTML file."""

import re
import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r') as f:
        return f.read()

# Read CSS
css = read('css/style.css')

# Read all JS modules in dependency order and strip import/export
js_files = [
    'js/constants.js',
    'js/input.js',
    'js/sprites.js',
    'js/data/maps.js',
    'js/data/characters.js',
    'js/data/story.js',
    'js/scenes/titleScene.js',
    'js/scenes/overworldScene.js',
    'js/scenes/battleScene.js',
    'js/scenes/skillTreeScene.js',
    'js/main.js',
]

combined_js = []
for path in js_files:
    code = read(path)
    # Remove import lines
    code = re.sub(r'^\s*import\s+.*?;\s*$', '', code, flags=re.MULTILINE)
    # Remove 'export ' keyword (keep the rest)
    code = re.sub(r'^export\s+', '', code, flags=re.MULTILINE)
    combined_js.append(f'// ========== {path} ==========\n{code}')

all_js = '\n'.join(combined_js)

# Read HTML template and build output
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <title>Naruto Tactical RPG</title>
    <style>
{css}
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        <div id="ui-overlay" class="hidden">
            <div id="dialogue-box" class="hidden">
                <div id="dialogue-speaker"></div>
                <div id="dialogue-text"></div>
                <div id="dialogue-prompt">Tap A to continue</div>
            </div>
            <div id="battle-hud" class="hidden">
                <div id="battle-info"></div>
                <div id="action-menu" class="hidden"></div>
            </div>
        </div>
    </div>

    <!-- Virtual touch controls -->
    <div id="touch-controls">
        <div id="dpad">
            <button class="dpad-btn dpad-up" data-dir="up" aria-label="Up">&#9650;</button>
            <button class="dpad-btn dpad-left" data-dir="left" aria-label="Left">&#9664;</button>
            <button class="dpad-btn dpad-center"></button>
            <button class="dpad-btn dpad-right" data-dir="right" aria-label="Right">&#9654;</button>
            <button class="dpad-btn dpad-down" data-dir="down" aria-label="Down">&#9660;</button>
        </div>
        <div id="action-btns">
            <button class="action-touch-btn btn-a" data-key="Space" aria-label="Action">A</button>
            <button class="action-touch-btn btn-b" data-key="Escape" aria-label="Back">B</button>
        </div>
        <div id="util-btns">
            <button class="util-touch-btn" data-key="KeyQ" aria-label="Previous">Q</button>
            <button class="util-touch-btn" data-key="KeyT" aria-label="Skills">T</button>
            <button class="util-touch-btn" data-key="KeyE" aria-label="Next">E</button>
        </div>
    </div>

    <script>
{all_js}
    </script>
</body>
</html>
'''

out_path = os.path.join(BASE, 'naruto_tactical_rpg.html')
with open(out_path, 'w') as f:
    f.write(html)

print(f'Built: {out_path}')
print(f'Size: {len(html) // 1024} KB')
