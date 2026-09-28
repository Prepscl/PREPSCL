import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const componentPath = new URL('src/components/HomeAssembly.tsx', root);
const cssPath = new URL('src/app/globals.css', root);
const mp4Path = new URL('public/videos/hero-preps-seedance25-v2.mp4', root);
const webmPath = new URL('public/videos/hero-preps-seedance25-v2.webm', root);

function probe(path) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=width,height,avg_frame_rate',
    '-of', 'json',
    path.pathname.slice(1),
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('home hero uses the corrected Seedance assets', () => {
  const source = readFileSync(componentPath, 'utf8');
  assert.match(source, /hero-preps-seedance25-v2\.webm/);
  assert.match(source, /hero-preps-seedance25-v2\.mp4/);
  assert.ok(
    source.indexOf('hero-preps-seedance25-v2.mp4') < source.indexOf('hero-preps-seedance25-v2.webm'),
    'the higher-bitrate MP4 must be preferred',
  );
  assert.equal(existsSync(webmPath), true, 'corrected WebM must exist');
  assert.equal(existsSync(mp4Path), true, 'corrected MP4 must exist');
});

test('corrected hero media is 720p, 24 fps and about eight seconds', () => {
  const media = [probe(mp4Path), probe(webmPath)];
  for (const info of media) {
    const stream = info.streams[0];
    const duration = Number(info.format.duration);
    assert.equal(stream.width, 1280);
    assert.equal(stream.height, 720);
    assert.equal(stream.avg_frame_rate, '24/1');
    assert.ok(duration >= 7.9 && duration <= 8.2, `unexpected duration ${duration}`);
  }
});

test('hero preserves the full 16:9 composition instead of cropping it', () => {
  const css = readFileSync(cssPath, 'utf8');
  assert.match(css, /\.home-photo\s*\{[^}]*object-fit:\s*contain/s);
  assert.doesNotMatch(css, /\.home-photo\s*\{\s*object-fit:\s*cover/);
});

test('the generated final frame remains visible when playback ends', () => {
  const source = readFileSync(componentPath, 'utf8');
  assert.doesNotMatch(source, /addEventListener\('ended'/);
  assert.doesNotMatch(source, /removeEventListener\('ended'/);
});

test('the closing shot remains the original Seedance animation', () => {
  const original = resolve(homedir(), 'Videos/PREPS/Kie/seedance25_preps_720p.mp4');
  const corrected = fileURLToPath(mp4Path);
  const result = spawnSync('ffmpeg', [
    '-v', 'info', '-ss', '7.5', '-i', original,
    '-ss', '7.5', '-i', corrected,
    '-filter_complex', '[0:v][1:v]ssim', '-frames:v', '1', '-f', 'null', '-',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const match = result.stderr.match(/All:([0-9.]+)/);
  assert.ok(match, 'ffmpeg must report SSIM');
  assert.ok(Number(match[1]) > 0.97, `closing frame SSIM was ${match[1]}`);
});
