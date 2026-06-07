const fs = require('fs');
const path = require('path');

const AR_ROOT = path.join(__dirname, '..', 'ar');

// Allowed Latin tokens (brands, models, URLs, dates)
const ALLOWED = /^(KIWL|SK|SE|SV|SH|NS|J6|CHINAPLAS|PLASTEX|TikTok|Douyin|HTML|CSS|JS|EN|AR|PDF|PET|FMS|SKII|SK-HYB|SK2|SK140|SK240|SK380|SK350|SK300|SK700|SK140II|SE180|SE\d+|ISO|UFI|OEM|ODM|PLC|IoT|R&D|CEO|CNC|USB|WiFi|GPS|ATM|PVC|PE|PP|ABS|PC|PA|PMMA|POM|PBT|HIPS|GPPS|EPS|EVA|TPE|TPU|TPO|TPEE|PA6|PA66|PEEK|PPS|LCP|PCT|PEI|PES|PSU|PPSU|PI|PTFE|PVDF|PFA|ETFE|FEP|PCTFE|ECTFE|PVF|PVDC|EVOH|COC|COP|TPX|PMI|PPO|PPE|SAN|ASA|AES|ACS|MBS|ABS\/PC|PC\/ABS|PC\/PBT|PBT\/PET|PETG|APET|CPET|OPET|BOPET|BOPP|BOPE|BOPI|BOPA|BOPET|BOPLA|PLA|PHA|PHB|PHBV|PBS|PBAT|PCL|PGA|PLGA|P3HB|P4HB|P3HT|PEDOT|PSS|PEI|PEEK|PES|PSU|PPSU|PI|PTFE|PVDF|PFA|ETFE|FEP|PCTFE|ECTFE|PVF|PVDC|EVOH|COC|COP|TPX|PMI|PPO|PPE|SAN|ASA|AES|ACS|MBS|\d{4}|\d{1,2}:\d{2}|www\.|http|\.html|\.css|\.js|\.jpg|\.png|\.gif|\.webm|\.pdf|index|swiper|jquery|layer|fancybox|javascript|Mirrored|HTTrack|XR&CO|GMT|W3C|DTD|XHTML|Transitional|EN|utf-8|viewport|charset|stylesheet|script|meta|link|div|span|ul|li|form|input|submit|text|search|keys|value|href|src|class|id|type|name|action|method|post|get|blank|nofollow|noopener|noreferrer|target|rel|alt|title|width|height|style|display|none|block|inline|flex|grid|float|left|right|center|margin|padding|border|background|color|font|size|weight|family|line|height|text|align|vertical|overflow|hidden|visible|absolute|relative|fixed|static|sticky|z-index|opacity|transform|transition|animation|cursor|pointer|default|auto|inherit|initial|unset|revert|all|both|clear|clip|content|counter|quotes|resize|outline|box|shadow|radius|top|bottom|start|end|before|after|first|last|nth|child|hover|focus|active|visited|link|enabled|disabled|checked|empty|root|not|is|where|has|lang|dir|rtl|ltr|ar|en|zh|cn|com|cc|org|net|edu|gov|mil|int|co|io|ai|dev|app|web|site|online|store|shop|blog|info|biz|name|pro|aero|asia|cat|coop|jobs|mobi|museum|tel|travel|xxx|post|geo|local|onion|i2p|zkey|bit|lib|eth|crypto|nft|dao|defi|web3|metaverse|blockchain|bitcoin|ethereum|solana|polygon|avalanche|arbitrum|optimism|base|zksync|starknet|linea|scroll|mantle|blast|mode|zora|lens|farcaster|nostr|mastodon|threads|bluesky|twitter|facebook|instagram|linkedin|youtube|tiktok|wechat|weibo|qq|baidu|alibaba|tencent|huawei|xiaomi|oppo|vivo|realme|oneplus|honor|meizu|lenovo|asus|acer|dell|hp|ibm|intel|amd|nvidia|qualcomm|mediatek|apple|google|microsoft|amazon|meta|tesla|spacex|openai|anthropic|cursor|github|gitlab|bitbucket|stackoverflow|reddit|discord|telegram|whatsapp|signal|slack|zoom|teams|skype|viber|line|kakao|naver|yahoo|bing|duckduckgo|brave|firefox|chrome|safari|edge|opera|vivaldi|tor|vpn|cdn|api|sdk|aws|azure|gcp|cloudflare|vercel|netlify|heroku|digitalocean|linode|vultr|ovh|hetzner|contabo|hostinger|godaddy|namecheap|cloudfront|s3|ec2|rds|lambda|dynamodb|sqs|sns|ses|route53|cloudwatch|iam|vpc|subnet|gateway|load|balancer|autoscaling|elastic|beanstalk|lightsail|fargate|ecs|eks|kubernetes|docker|container|registry|helm|terraform|ansible|puppet|chef|salt|jenkins|travis|circleci|github|actions|gitlab|ci|bitbucket|pipelines|azure|devops|teamcity|bamboo|octopus|deploy|spinnaker|argocd|flux|istio|linkerd|envoy|nginx|apache|caddy|traefik|haproxy|varnish|redis|memcached|mongodb|postgresql|mysql|mariadb|sqlite|oracle|sqlserver|db2|cassandra|couchdb|neo4j|elasticsearch|solr|kafka|rabbitmq|nats|pulsar|zeromq|grpc|graphql|rest|soap|websocket|mqtt|amqp|stomp|sse|webhook|oauth|jwt|saml|ldap|kerberos|ssl|tls|https|ssh|ftp|sftp|scp|rsync|dns|dhcp|ntp|smtp|pop3|imap|snmp|syslog|netflow|sflow|ipfix|bgp|ospf|eigrp|rip|isis|mpls|vlan|vxlan|gre|ipsec|wireguard|openvpn|pptp|l2tp|ikev2|sstp|softether|tailscale|zerotier|hamachi|teamviewer|anydesk|rustdesk|parsec|moonlight|sunshine|steam|epic|origin|uplay|gog|itch|humble|bundle|game|pass|xbox|playstation|nintendo|switch|wii|ds|3ds|psp|vita|steamdeck|rog|ally|legion|go|ayaneo|gpd|win|max|one|xplayer|onexplayer|aokzoe|anbernic|retroid|miyoo|rg|35xx|280v|405m|503|552|n64|ps1|ps2|gba|gbc|gb|nes|snes|genesis|megadrive|saturn|dreamcast|neogeo|atari|commodore|amiga|zx|spectrum|msx|pcengine|turbografx|3do|jaguar|lynx|gamegear|mastersystem|gameboy|advance|color|pocket|micro|sp|ds|lite|xl|2ds|3ds|new|pro|xl|switch|lite|oled|wii|u|mini|gamecube|n64|virtual|boy|satellaview|64dd|ique|famicom|disk|system|super|famicom|jr|sharp|twins|sf|alpha|super|grafx|pc|engine|gt|express|duo|rx|lt|core|grafx|supergrafx|arcade|card|pce|cd|super|cd|rom|cart|flash|everdrive|sd2snes|super|everdrive|mega|everdrive|gb|everdrive|gbc|everdrive|gba|everdrive|n64|everdrive|saturn|ode|dreamcast|ode|gdemu|usb|gd|loader|mode|sega|cd|bios|region|free|jtag|rgh|odde|flashed|hacked|modded|homebrew|emulator|retroarch|openemu|dolphin|pcsx2|rpcs3|yuzu|ryujinx|citra|cemu|xenia|duckstation|mednafen|mame|fba|nebula|kawaks|winkawaks|rainbow|model|demul|nulldc|redream|flycast|reicast|lxdream|demul|higan|bsnes|snes9x|zsnes|nestopia|fceux|mesen|puae|winuae|fs-uae|vice|cap32|atari800|stella|prosystem|handy|potator|geolith|aresg|ares|noo|moo|foo|bar|baz|qux|quux|corge|grault|garply|waldo|fred|plugh|xyzzy|thud)$/i;

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, list);
    else if (name.endsWith('.html')) list.push(full);
  }
  return list;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const enWords = new Set();
const cnChars = new Set();
const issues = [];

for (const file of walk(AR_ROOT)) {
  const html = fs.readFileSync(file, 'utf8');
  const text = stripHtml(html);
  const rel = path.relative(AR_ROOT, file).replace(/\\/g, '/');

  const cn = text.match(/[\u4e00-\u9fff]+/g);
  if (cn) cn.forEach((s) => cnChars.add(s));

  const words = text.match(/[A-Za-z]{4,}/g) || [];
  for (const w of words) {
    if (ALLOWED.test(w)) continue;
    if (/^(Mirrored|HTTrack|Website|Copier|Transitional|sunbun)$/i.test(w)) continue;
    enWords.add(w);
    if (issues.length < 30) issues.push({ file: rel, word: w });
  }
}

console.log('Files checked:', walk(AR_ROOT).length);
console.log('Unique Chinese segments:', cnChars.size);
console.log('Unique English words (4+ chars, unfiltered sample):', enWords.size);
console.log('Sample issues:', issues.slice(0, 15));

if (cnChars.size > 0) {
  console.log('\nChinese samples:');
  [...cnChars].sort((a, b) => b.length - a.length).slice(0, 5).forEach((s) => console.log(' ', s.slice(0, 80)));
}
if (enWords.size > 0) {
  console.log('\nEnglish word samples:');
  [...enWords].sort((a, b) => b.length - a.length).slice(0, 20).forEach((s) => console.log(' ', s));
}
