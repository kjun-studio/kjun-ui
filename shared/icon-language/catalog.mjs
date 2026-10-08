import { words } from './lexicon.mjs';
import { brands } from './brands.mjs';
import { special, phrases } from './special-terms.mjs';
import { iconLabels } from '../icon-labels.ts';

const categories = Object.fromEntries(`Development=개발 프로그래밍|Text=텍스트 글자|Math=수학 수식|Devices=기기 장치|Health=건강 의료|Nature=자연 환경|Sport=스포츠 운동|Design=디자인 편집|System=시스템 설정|Communication=통신 소통|Vehicles=차량 교통|Map=지도 위치|Media=미디어 재생|Letters=문자 알파벳|Symbols=기호 표시|Photography=사진 촬영|Food=음식 식사|Games=게임 놀이|Document=문서 파일|Buildings=건물 장소|Arrows=화살표 방향|Badges=배지 인증|E-commerce=쇼핑 구매|Animals=동물 생물|Computers=컴퓨터 전산|Laundry=세탁 의류|Extensions=확장 기능|Shapes=도형 모양|Numbers=숫자 번호|Brand=브랜드 서비스|Charts=차트 그래프|Electrical=전기 회로|Weather=날씨 기상|Database=데이터베이스 저장|Currencies=화폐 통화|Gender=성별 젠더|Version control=버전 관리|Gestures=제스처 손짓|Logic=논리 연산|Mood=감정 표정|Zodiac=별자리 점성술`.split('|').map(pair => pair.split('=')));
const vocabulary = { ...words, ...special };
function translate(word) {
  if (vocabulary[word]) return vocabulary[word];
  if (/^\d+$/.test(word)) return word;
  if (/^[a-z]$/.test(word)) return '문자 ' + word.toUpperCase();
  if (/^f\d$/.test(word)) return '기능 키 ' + word.toUpperCase();
  throw Error('Missing Korean icon term: ' + word);
}
// Keep the original, reviewed UI names and synonyms verbatim. The remaining
// official names use the reviewed terminology, brand readings and phrase exceptions.
export function koreanCatalog(metadata) {
  const legacy = new Map();
  for (const [name, label, ...aliases] of iconLabels) {
    if (legacy.has(name)) throw Error('Duplicate legacy Korean icon: ' + name);
    legacy.set(name, { label, aliases });
  }
  const seen = new Set(), labels = new Set();
  const phraseNames = Object.keys(phrases).sort((a, b) => b.length - a.length);
  if (phraseNames.some(name => !metadata.some(entry => entry.name === name))) throw Error('Unknown Korean phrase override');
  const result = metadata.map(entry => {
    if (seen.has(entry.name)) throw Error('Duplicate official icon: ' + entry.name);
    seen.add(entry.name);
    const category = categories[entry.category];
    if (!category) throw Error('Missing Korean category: ' + entry.category);
    const brand = entry.name.startsWith('brand-');
    const parts = entry.name.split('-');
    const terms = brand ? [brands[entry.name.slice(6)]] : parts.map((word, index) =>
      word === 'x' && parts[index - 1] !== 'letter' && entry.category !== 'Math' ? '엑스 표시' : translate(word));
    if (terms.some(term => !term)) throw Error('Missing Korean brand: ' + entry.name);
    const original = legacy.get(entry.name);
    const phrase = phraseNames.find(name => entry.name === name || entry.name.startsWith(name + '-'));
    const translated = phrase ? [phrases[phrase], ...entry.name.slice(phrase.length).split('-').filter(Boolean).map(translate)] : terms;
    const label = original?.label || translated.join(' ').replaceAll('문자 문자 ', '문자 ');
    const aliases = [...new Set([...(original?.aliases || []), ...translated.filter(term => /[가-힣]/u.test(term)), category, ...category.split(' ')])];
    if (!/[가-힣]/u.test(label) || !aliases.length || aliases.some(alias => !alias.trim() || !/[가-힣]/u.test(alias)))
      throw Error('Invalid Korean icon information: ' + entry.name);
    if (labels.has(label)) throw Error('Duplicate Korean icon label: ' + label);
    labels.add(label);
    return { ...entry, label, aliases };
  });
  if (result.length !== 5166 || [...legacy.keys()].some(name => !seen.has(name))) throw Error('Incomplete Korean icon catalog');
  return result;
}
