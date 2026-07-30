import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const campaignDir = path.join(root, "keirounohi_2026");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(campaignDir, relativePath), "utf8");
}

const [html, css, mainJs, trackingJs, campaignText, productsText] = await Promise.all([
  read("index.html"),
  read("styles/main.css"),
  read("scripts/main.js"),
  read("scripts/tracking.js"),
  read("data/campaign.json"),
  read("data/products.json")
]);

let campaign;
let products;
try {
  campaign = JSON.parse(campaignText);
  products = JSON.parse(productsText);
} catch (error) {
  failures.push(`JSONを解析できません: ${error.message}`);
}

const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
assert(jsonLdBlocks.length === 1, "JSON-LDは1件必要です");
for (const block of jsonLdBlocks) {
  try {
    JSON.parse(block[1]);
  } catch (error) {
    failures.push(`JSON-LDを解析できません: ${error.message}`);
  }
}

const internalReferences = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1].split(/[?#]/)[0])
  .filter((reference) => reference && !reference.startsWith("#") && !/^(?:https?:|mailto:|tel:|data:)/.test(reference));

for (const reference of new Set(internalReferences)) {
  const resolved = path.resolve(campaignDir, reference);
  assert(resolved.startsWith(campaignDir), `キャンペーン外への相対参照です: ${reference}`);
  assert(await fileExists(resolved), `参照ファイルがありません: ${reference}`);
}

const ctaLinks = [...html.matchAll(/<a[^>]+data-base-url="([^"]+)"[^>]*>/g)];
assert(ctaLinks.length >= 8, "計測対象CTAが不足しています");
for (const [, destination] of ctaLinks) {
  assert(destination.startsWith("https://store.neo-fukuoka.jp/"), `CTAが公式ストア以外を参照しています: ${destination}`);
}

assert(campaign?.campaign_name === "keirounohi_2026", "campaign_nameが正しくありません");
assert(campaign?.utm_campaign === "keirounohi_2026", "utm_campaignが正しくありません");
assert(campaign?.event_date === "2026-09-21", "敬老の日の日付が正しくありません");
assert(campaign?.order_deadline === "2026-09-17T23:59:59+09:00", "注文期限の目安が正しくありません");
assert(Array.isArray(products?.products) && products.products.length >= 4, "商品データが不足しています");
assert(products?.products?.every((product) => product.campaigns?.includes("keirounohi_2026")), "商品データに敬老の日キャンペーン指定がありません");

assert(html.includes('rel="canonical" href="https://lp.neo-fukuoka.jp/keirounohi_2026/"'), "canonical URLが正しくありません");
assert(html.includes('property="og:image"'), "OGP画像が設定されていません");
assert(html.includes('name="twitter:card"'), "Twitter Cardが設定されていません");
assert(html.includes('<span class="eyebrow">敬老の日</span>'), "ファーストビューのキャンペーンラベルが正しくありません");
assert(html.includes('<time class="hero-date" datetime="2026-09-21"'), "ファーストビューに敬老の日の日付が表示されていません");
assert(html.includes('<h1 id="hero-title"><span>いつまでも</span><span>元気でいてほしい人へ</span></h1>'), "ファーストビュー見出しのHTMLが正しくありません");
assert(!html.includes("data-campaign-"), "HTMLに動的な文言上書き用属性が残っています");
assert(html.includes("9月17日中のご注文が目安です"), "配送締切の目安が表示されていません");
assert(html.includes("北海道・東北・沖縄・離島"), "配送に時間がかかる地域の案内がありません");
assert(!html.includes("【要確認：敬老の日到着分の注文締切】"), "古い配送締切の要確認表示が残っています");
assert(css.includes("--color-primary: #713f3d"), "ボルドーのアクセントカラーがCSS変数で定義されていません");
assert(css.includes('url("../assets/images/hero-botanical-ornament.webp")'), "ファーストビューの植物線画がCSSに設定されていません");
assert(await fileExists(path.join(campaignDir, "assets/images/hero-botanical-ornament.webp")), "植物線画の画像ファイルがありません");
assert(css.includes(":focus-visible"), "focus-visibleスタイルがありません");
assert(css.includes("prefers-reduced-motion"), "reduced motion対応がありません");
assert(mainJs.includes("ArrowRight") && mainJs.includes("ArrowLeft"), "タブのキーボード操作がありません");
assert(!mainJs.includes("loadCampaignContent"), "JavaScriptによる表示文言の上書き処理が残っています");
assert(!mainJs.includes('fetch("data/campaign.json"'), "表示用JavaScriptがcampaign.jsonを読み込んでいます");
assert(trackingJs.includes("campaign.utm_campaign"), "キャンペーン設定からUTMを取得していません");
assert(!trackingJs.includes('utm_campaign: "keirounohi_2026"'), "utm_campaignをJavaScriptへ固定しないでください");
assert(trackingJs.includes('if (!url.searchParams.has("utm_content"))'), "流入時のutm_contentを保持する処理がありません");

const forbiddenCopy = ["お中元", "父の日", "夏ギフト", "夏のご挨拶"];
for (const phrase of forbiddenCopy) {
  assert(!html.includes(phrase), `他キャンペーンの文言が残っています: ${phrase}`);
  assert(!campaignText.includes(phrase), `キャンペーン設定に他キャンペーンの文言が残っています: ${phrase}`);
  assert(!productsText.includes(phrase), `商品データに他キャンペーンの文言が残っています: ${phrase}`);
}

if (failures.length) {
  console.error("敬老の日LPの検証に失敗しました:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`敬老の日LPの検証に成功しました（内部参照 ${new Set(internalReferences).size}件、計測対象CTA ${ctaLinks.length}件）`);
