import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import {continueRender, delayRender} from './player';

// Fonts, loaded before the first frame is captured. Inter comes from
// public/fonts; JetBrains Mono from @fontsource (OFL), bundled, no network.

export const loadFont = ({family, url, weight}: {family: string; url: string; weight?: string}) => {
	const h = delayRender(`font ${family}`);
	const face = new FontFace(family, `url(${url})`, {weight: weight ?? 'normal'});
	document.fonts.add(face);
	face.load().finally(() => continueRender(h));
	return {fontFamily: family};
};

export const loadMono = () => {
	const h = delayRender('font JetBrains Mono');
	Promise.all(['400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"'].map((f) => document.fonts.load(f))).finally(() => continueRender(h));
	return {fontFamily: 'JetBrains Mono'};
};
