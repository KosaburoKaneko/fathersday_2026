import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve("fukuoka_airport_popup_2026");
const htmlPath = resolve(root, "index.html");
const html = readFileSync(htmlPath, "utf8");
const errors = [];

const requiredText = [
  "福岡空港 国内線旅客ターミナルビル 2F",
  "9月2日(水)〜9月30日(水)",
  "9:00〜19:00",
  "ネオ柚子胡椒",
  "激辛ネオ柚子胡椒",
  "ごはんにかけるもつ鍋",
  "試食できます"
];

requiredText.forEach((text) => {
  if (!html.includes(text)) errors.push(`必須テキストがありません: ${text}`);
});

if (/9月(?:2|30)日（/.test(html)) errors.push("曜日表記に全角括弧が含まれています");
if (!html.includes('id="access"')) errors.push("アクセスアンカーがありません");
if (html.includes('class="mobile-sticky"')) errors.push("削除対象のスマートフォン固定CTAが残っています");
if (/明太子だけじゃない|明太子より|定番土産に飽きたら/.test(html)) errors.push("禁止コピーが含まれています");

const assetPattern = /(?:src|href)="([^"#][^"]*)"/g;
for (const match of html.matchAll(assetPattern)) {
  const asset = match[1];
  if (/^(?:https?:|mailto:|tel:)/.test(asset)) continue;
  const localPath = resolve(dirname(htmlPath), asset.split("?")[0]);
  if (!existsSync(localPath)) errors.push(`参照ファイルがありません: ${asset}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("福岡空港ポップアップLPの必須情報・曜日表記・ローカル参照を確認しました。");
